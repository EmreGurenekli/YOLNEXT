export type AnyShipmentLike = Record<string, any>;

const firstNonEmpty = (...values: any[]): string => {
  for (const v of values) {
    if (v == null) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return '';
};

export const resolveShipmentCity = (row: AnyShipmentLike, prefix: 'pickup' | 'delivery'): string => {
  const city =
    row?.[`${prefix}City`] ||
    row?.[`${prefix}_city`] ||
    row?.[`${prefix}city`] ||
    (prefix === 'pickup'
      ? row?.fromCity || row?.from_city || row?.fromcity || row?.from
      : row?.toCity || row?.to_city || row?.tocity || row?.to);

  const district =
    row?.[`${prefix}District`] ||
    row?.[`${prefix}_district`] ||
    row?.[`${prefix}district`] ||
    (prefix === 'pickup'
      ? row?.fromDistrict || row?.from_district
      : row?.toDistrict || row?.to_district);

  const text = [city, district].filter(Boolean).join(', ').trim();
  return text;
};

export const resolveShipmentRoute = (row: AnyShipmentLike): { from: string; to: string } => {
  const from =
    resolveShipmentCity(row, 'pickup') ||
    firstNonEmpty(
      row?.pickupAddress,
      row?.pickup_address,
      row?.pickupaddress,
      row?.from_address,
      row?.fromaddress
    );

  const to =
    resolveShipmentCity(row, 'delivery') ||
    firstNonEmpty(
      row?.deliveryAddress,
      row?.delivery_address,
      row?.deliveryaddress,
      row?.to_address,
      row?.toaddress
    );

  return {
    from: from || 'Bilinmiyor',
    to: to || 'Bilinmiyor',
  };
};

export const formatShipmentRoute = (row: AnyShipmentLike): string => {
  const { from, to } = resolveShipmentRoute(row);
  return `${from} → ${to}`;
};
