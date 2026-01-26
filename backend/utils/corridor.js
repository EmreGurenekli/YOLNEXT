/**
 * Corridor utilities (no external deps).
 *
 * Goal: Provide a deterministic, explainable "route corridor" approximation
 * without calling third-party routing services.
 *
 * Implementation strategy:
 * - Use curated corridor hints for the most common long-distance lanes.
 * - Fall back to a simple [from, to] corridor when no hint exists.
 *
 * IMPORTANT:
 * - City values in the product refer to Turkish provinces (İl) like "Kocaeli".
 * - Districts (İlçe) should NOT be passed as city.
 */

function normalizeCityKey(input) {
  const raw = String(input || '').trim();
  if (!raw) return '';

  // Normalize Turkish characters to a consistent, ASCII-friendly key.
  // This helps match older datasets that might store "Istanbul" vs "İstanbul".
  return raw
    .toLocaleLowerCase('tr-TR')
    .replace(/[ıİ]/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

const buildHintKey = (fromKey, toKey) => `${fromKey}->${toKey}`;

// Curated corridor hints for high-frequency lanes.
// Values are Turkish province display names (we normalize them at runtime).
const CORRIDOR_HINTS = Object.freeze({
  [buildHintKey('istanbul', 'ankara')]: ['İstanbul', 'Kocaeli', 'Sakarya', 'Düzce', 'Bolu', 'Ankara'],
  [buildHintKey('ankara', 'istanbul')]: ['Ankara', 'Bolu', 'Düzce', 'Sakarya', 'Kocaeli', 'İstanbul'],

  [buildHintKey('istanbul', 'izmir')]: ['İstanbul', 'Bursa', 'Balıkesir', 'Manisa', 'İzmir'],
  [buildHintKey('izmir', 'istanbul')]: ['İzmir', 'Manisa', 'Balıkesir', 'Bursa', 'İstanbul'],

  [buildHintKey('ankara', 'izmir')]: ['Ankara', 'Eskişehir', 'Kütahya', 'Manisa', 'İzmir'],
  [buildHintKey('izmir', 'ankara')]: ['İzmir', 'Manisa', 'Kütahya', 'Eskişehir', 'Ankara'],

  [buildHintKey('ankara', 'antalya')]: ['Ankara', 'Konya', 'Isparta', 'Antalya'],
  [buildHintKey('antalya', 'ankara')]: ['Antalya', 'Isparta', 'Konya', 'Ankara'],

  [buildHintKey('izmir', 'antalya')]: ['İzmir', 'Aydın', 'Denizli', 'Burdur', 'Antalya'],
  [buildHintKey('antalya', 'izmir')]: ['Antalya', 'Burdur', 'Denizli', 'Aydın', 'İzmir'],

  [buildHintKey('ankara', 'adana')]: ['Ankara', 'Aksaray', 'Niğde', 'Adana'],
  [buildHintKey('adana', 'ankara')]: ['Adana', 'Niğde', 'Aksaray', 'Ankara'],

  [buildHintKey('istanbul', 'adana')]: ['İstanbul', 'Kocaeli', 'Sakarya', 'Düzce', 'Bolu', 'Ankara', 'Aksaray', 'Niğde', 'Adana'],
  [buildHintKey('adana', 'istanbul')]: ['Adana', 'Niğde', 'Aksaray', 'Ankara', 'Bolu', 'Düzce', 'Sakarya', 'Kocaeli', 'İstanbul'],
});

function getCorridorPathKeys(fromCity, toCity) {
  const fromKey = normalizeCityKey(fromCity);
  const toKey = normalizeCityKey(toCity);
  if (!fromKey || !toKey) return [];
  if (fromKey === toKey) return [fromKey];

  const hint = CORRIDOR_HINTS[buildHintKey(fromKey, toKey)];
  const names = Array.isArray(hint) && hint.length ? hint : [String(fromCity || '').trim(), String(toCity || '').trim()];
  const keys = names.map(normalizeCityKey).filter(Boolean);

  // Ensure corridor always starts/ends with the requested endpoints (even if hints are missing/messy)
  if (keys[0] !== fromKey) keys.unshift(fromKey);
  if (keys[keys.length - 1] !== toKey) keys.push(toKey);

  // Deduplicate while preserving order
  return [...new Set(keys)];
}

function isShipmentOnCorridor(pickupCity, deliveryCity, corridorKeys) {
  const pickupKey = normalizeCityKey(pickupCity);
  const deliveryKey = normalizeCityKey(deliveryCity);
  if (!pickupKey || !deliveryKey) return { ok: false, reason: 'missing_city' };
  if (!Array.isArray(corridorKeys) || corridorKeys.length === 0) return { ok: false, reason: 'missing_corridor' };

  const fromIdx = corridorKeys.indexOf(pickupKey);
  const toIdx = corridorKeys.indexOf(deliveryKey);
  if (fromIdx === -1 || toIdx === -1) return { ok: false, reason: 'not_in_corridor' };
  if (fromIdx === toIdx) return { ok: false, reason: 'same_point' };

  return { ok: true, direction: fromIdx < toIdx ? 'outbound' : 'backhaul', fromIdx, toIdx };
}

module.exports = {
  normalizeCityKey,
  getCorridorPathKeys,
  isShipmentOnCorridor,
};

