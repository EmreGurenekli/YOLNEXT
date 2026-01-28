import React, { useMemo, useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Search,
  Send,
  Phone,
  MoreVertical,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Paperclip,
  Smile,
  Mic,
  Video,
  PhoneCall,
  User,
  Building2,
  Truck,
  Package,
  MapPin,
  Calendar,
  Eye,
  Archive,
  Pin,
  Reply,
  Forward,
  Bell,
  Settings,
  RefreshCw,
  Trash2,
  MessageSquare,
  Check,
  CheckCheck,
} from 'lucide-react';
import { createApiUrl } from '../../config/api';
import GuidanceOverlay from '../../components/shared-ui-elements/GuidanceOverlay';
import { messageAPI } from '../../services/apiClient';
import Breadcrumb from '../../components/shared-ui-elements/Breadcrumb';
import EmptyState from '../../components/shared-ui-elements/EmptyState';
import LoadingState from '../../components/shared-ui-elements/LoadingState';
import { sanitizeMessageText } from '../../utils/format';

interface Message {
  id: string;
  from: string;
  fromType: 'carrier' | 'system' | 'client' | 'admin' | 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  message: string;
  timestamp: string;
  createdAt?: string;
  shipmentId?: string;
  read?: boolean;
  edited?: boolean;
  deleted?: boolean;
  isRead: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string | number;
  otherUserId?: string | number;
  carrierId?: string | number;
  participantId?: string | number;
  carrierName?: string;
  carrierCompany?: string;
  participant?: string;
  participantType?: 'client' | 'admin' | 'carrier' | 'individual' | 'corporate' | 'nakliyeci' | 'tasiyici';
  lastMessage: string;
  lastMessageTime: string;
  lastMessageCreatedAt?: string;
  unreadCount?: number;
  isOnline?: boolean;
  isArchived?: boolean;
  messages?: Message[];
  shipmentId?: string | number;
  trackingNumber?: string;
  status?: string;
}

// Bireysel Gönderici - Nakliyeciye soracağı sorular
const quickMessagesIndividual = [
  'Ne zaman yola çıkacaksınız?',
  'Tahmini teslim saati nedir?',
  'Yükleme adresine ne zaman gelirsiniz?',
  'Teslimat durumu nedir?',
];

// Kurumsal Gönderici - Daha formal, iş odaklı
const quickMessagesCorporate = [
  'Tahmini teslimat tarihi ve saati nedir?',
  'Yükleme saatini teyit edebilir misiniz?',
  'Araç bilgilerini paylaşır mısınız?',
  'İş durumu hakkında bilgi alabilir miyim?',
];

// Nakliyeci - Hem gönderici hem taşıyıcı ile konuşuyor
const quickMessagesNakliyeci = [
  'Adres bilgilerini teyit edebilir misiniz?',
  'Yük hazır mı?',
  'Taşıyıcı atandı, kısa sürede gelecek',
  'Teslimat tamamlandı mı?',
];

// Taşıyıcı - Nakliyeciye/Gönderiye durum bilgisi
const quickMessagesTasiyici = [
  'Yükleme noktasına geldim',
  'Yola çıktım',
  'Teslim noktasına yaklaştım',
  'Teslimat tamamlandı',
  'Gecikme var, bilgi vereceğim',
];

interface UnifiedMessagesProps {
  userType: 'corporate' | 'individual' | 'nakliyeci' | 'tasiyici';
}

export default function UnifiedMessages({ userType }: UnifiedMessagesProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const shipmentIdParam = searchParams.get('shipmentId');
  const prefillParam = searchParams.get('prefill');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'corporate': return 'Kurumsal';
      case 'individual': return 'Bireysel';
      case 'nakliyeci': return 'Nakliyeci';
      case 'tasiyici': return 'Taşıyıcı';
      default: return '';
    }
  };

  const getDashboardUrl = () => {
    switch (userType) {
      case 'corporate': return '/corporate/dashboard';
      case 'individual': return '/individual/dashboard';
      case 'nakliyeci': return '/nakliyeci/dashboard';
      case 'tasiyici': return '/tasiyici/dashboard';
      default: return '/';
    }
  };

  const getMessagesUrl = () => {
    switch (userType) {
      case 'corporate': return '/corporate/messages';
      case 'individual': return '/individual/messages';
      case 'nakliyeci': return '/nakliyeci/messages';
      case 'tasiyici': return '/tasiyici/messages';
      default: return '/messages';
    }
  };

  const getSettingsUrl = () => {
    switch (userType) {
      case 'corporate': return '/corporate/settings';
      case 'individual': return '/individual/settings';
      case 'nakliyeci': return '/nakliyeci/settings';
      case 'tasiyici': return '/tasiyici/settings';
      default: return '/settings';
    }
  };

  const getOtherUserLabel = () => {
    switch (userType) {
      case 'corporate':
      case 'individual': return 'Nakliyeci';
      case 'nakliyeci': return 'Taşıyıcı';
      case 'tasiyici': return 'Nakliyeci';
      default: return 'Diğer';
    }
  };

  const quickMessagesForUser = useMemo(() => {
    switch (userType) {
      case 'individual':
        return quickMessagesIndividual;
      case 'corporate':
        return quickMessagesCorporate;
      case 'nakliyeci':
        return quickMessagesNakliyeci;
      case 'tasiyici':
        return quickMessagesTasiyici;
      default:
        return quickMessagesIndividual;
    }
  }, [userType]);

  useEffect(() => {
    loadConversations();
  }, []);

  const getCurrentUserId = () => {
    const direct =
      localStorage.getItem('userId') ||
      localStorage.getItem('userid') ||
      localStorage.getItem('user_id') ||
      '';
    const cleaned = String(direct || '').trim();
    if (cleaned && cleaned !== 'null' && cleaned !== 'undefined') return cleaned;

    const rawUser = localStorage.getItem('user') || localStorage.getItem('YolNext_user');
    if (!rawUser) return '';
    try {
      const parsed = JSON.parse(rawUser);
      const id = parsed?.id ?? parsed?.userId ?? parsed?.user_id ?? parsed?.userid;
      return id != null ? String(id) : '';
    } catch (_) {
      return '';
    }
  };

  const toTrackingCode = (value: any, idFallback?: any) => {
    const v = String(value ?? '').trim();
    const fallback = String(idFallback ?? '').trim();

    if (!v) {
      if (!fallback) return '';
      if (/^TRK/i.test(fallback)) return fallback;
      const n = Number(fallback);
      if (Number.isFinite(n) && n > 0) {
        return `TRK${Math.trunc(n).toString().padStart(6, '0')}`;
      }
      return fallback;
    }

    if (/^TRK/i.test(v)) return v;
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) {
      return `TRK${Math.trunc(n).toString().padStart(6, '0')}`;
    }
    return v;
  };

  const formatMessageTime = (value: any) => {
    const ts = value ? new Date(value) : null;
    return ts && !Number.isNaN(ts.getTime())
      ? ts.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      : '';
  };

  const toIsoStringOrNull = (value: any) => {
    try {
      if (!value) return null;
      const d = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch (_) {
      return null;
    }
  };

  const getConversationKey = (c: Conversation) => {
    const shipmentId = c.shipmentId != null ? String(c.shipmentId) : '';
    const tracking = String(c.trackingNumber || '').trim();
    const shipmentKey = tracking || shipmentId;
    const other = c.otherUserId ?? c.participantId ?? c.carrierId ?? '';
    const otherId = other != null ? String(other) : '';

    const nameFallback =
      String(c.carrierName || c.participant || '').trim() ||
      '';

    // Prefer name within a shipment thread when available. This avoids duplicate rows
    // when backend returns inconsistent otherUserId for the same counterparty.
    return `${shipmentKey}::${nameFallback || otherId}`;
  };

  const normalizeConversations = (items: Conversation[]) => {
    const withTs = (c: Conversation) => {
      const ts = c.lastMessageCreatedAt ? Date.parse(c.lastMessageCreatedAt) : NaN;
      return Number.isFinite(ts) ? ts : 0;
    };

    const sorted = (Array.isArray(items) ? items : [])
      .slice()
      .sort((a, b) => withTs(b) - withTs(a));

    const seen = new Set<string>();
    const out: Conversation[] = [];
    for (const c of sorted) {
      const key = getConversationKey(c);
      if (!key || key === '::') {
        out.push(c);
        continue;
      }
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  };

  const mapApiConversationToUi = (row: any): Conversation => {
    const shipmentIdRaw =
      row?.shipmentId ??
      row?.shipmentid ??
      row?.shipment_id ??
      row?.shipmentID ??
      undefined;
    const shipmentId = shipmentIdRaw != null && String(shipmentIdRaw).trim() !== '' ? String(shipmentIdRaw) : undefined;

    const otherUserIdRaw =
      row?.otherUserId ??
      row?.otheruserid ??
      row?.other_user_id ??
      row?.otherUserID ??
      row?.participantId ??
      row?.participantid ??
      row?.carrierId ??
      row?.carrierid ??
      undefined;
    const otherUserId = otherUserIdRaw != null && String(otherUserIdRaw).trim() !== '' ? String(otherUserIdRaw) : undefined;

    const otherUserName =
      String(
        row?.otherUserName ??
          row?.otherusername ??
          row?.other_user_name ??
          row?.participant ??
          row?.carrierName ??
          ''
      ).trim() || getOtherUserLabel();

    const createdAt =
      row?.createdAt ||
      row?.created_at ||
      row?.createdat ||
      row?.timestamp ||
      row?.time ||
      null;

    const lastMessage = sanitizeMessageText(String(row?.lastMessage ?? row?.message ?? row?.content ?? row?.text ?? '').trim());
    const lastMessageTime = formatMessageTime(createdAt);
    const lastMessageCreatedAt = toIsoStringOrNull(createdAt) || undefined;

    const currentUserId = getCurrentUserId();
    const senderId = row?.senderId ?? row?.senderid ?? row?.sender_id;
    const receiverId = row?.receiverId ?? row?.receiverid ?? row?.receiver_id;
    const incoming = currentUserId && senderId != null && String(senderId) !== String(currentUserId);
    const isRead = Boolean(row?.isRead ?? row?.isread ?? row?.read ?? false);
    const unreadCount = incoming && !isRead ? 1 : 0;

    const derivedOtherUserId = (() => {
      if (otherUserId) return otherUserId;
      if (!currentUserId) return undefined;
      if (senderId != null && receiverId != null) {
        return String(senderId) === String(currentUserId) ? String(receiverId) : String(senderId);
      }
      if (senderId != null && String(senderId) !== String(currentUserId)) return String(senderId);
      if (receiverId != null && String(receiverId) !== String(currentUserId)) return String(receiverId);
      return undefined;
    })();

    const id = shipmentId
      ? `thread-${String(derivedOtherUserId || 'unknown')}-shipment-${shipmentId}`
      : `thread-${String(derivedOtherUserId || row?.id || Math.random())}`;
    const trackingNumber = toTrackingCode(
      row?.trackingNumber ?? row?.tracking_number ?? row?.trackingnumber,
      shipmentId
    );

    return {
      id,
      otherUserId: derivedOtherUserId,
      carrierId: derivedOtherUserId,
      participantId: derivedOtherUserId,
      carrierName: otherUserName,
      carrierCompany: row?.carrierCompany ?? row?.companyName ?? row?.company_name ?? undefined,
      participant: otherUserName,
      lastMessage,
      lastMessageTime,
      lastMessageCreatedAt,
      unreadCount,
      isOnline: false,
      isArchived: Boolean(row?.isArchived ?? row?.is_archived ?? false),
      messages: Array.isArray(row?.messages) ? row.messages : undefined,
      shipmentId,
      trackingNumber: trackingNumber || undefined,
      status: row?.status ? String(row.status) : undefined,
    };
  };

  const mapApiMessageToUi = (m: any): Message => {
    const created =
      m?.createdAt ||
      m?.created_at ||
      m?.createdat ||
      m?.timestamp ||
      m?.time ||
      null;
    const ts = created ? new Date(created) : null;
    const safeTime = ts && !Number.isNaN(ts.getTime())
      ? ts.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      : '';
    const createdAt = ts && !Number.isNaN(ts.getTime()) ? ts.toISOString() : undefined;

    const messageText = sanitizeMessageText(String(m?.message ?? m?.text ?? '').trim());

    const currentUserId = getCurrentUserId();
    const senderId = m?.senderId ?? m?.senderid ?? m?.sender_id;
    const isMine = currentUserId && senderId != null && String(senderId) === String(currentUserId);

    const fromRole = String(m?.senderrole || m?.senderRole || m?.fromType || '').toLowerCase();
    const fromType = ((): Message['fromType'] => {
      if (fromRole === 'individual') return 'individual';
      if (fromRole === 'corporate') return 'corporate';
      if (fromRole === 'nakliyeci' || fromRole === 'carrier') return 'nakliyeci';
      if (fromRole === 'tasiyici' || fromRole === 'driver') return 'tasiyici';
      return userType === 'nakliyeci' || userType === 'tasiyici' ? 'client' : 'carrier';
    })();

    const resolvedFrom = isMine ? 'Siz' : String(m?.sendername || m?.senderName || m?.from || '').trim() || getOtherUserLabel();
    const resolvedFromType = isMine ? (userType as Message['fromType']) : fromType;

    return {
      id: String(m?.id ?? `m-${Math.random()}`),
      from: resolvedFrom,
      fromType: resolvedFromType,
      message: messageText,
      timestamp: safeTime,
      createdAt,
      shipmentId: String(m?.shipmentId || m?.shipmentid || ''),
      isRead: Boolean(m?.isRead ?? m?.isread ?? m?.read ?? false),
      read: Boolean(m?.read ?? m?.isRead ?? m?.isread ?? false),
    };
  };

  const deriveOtherUserIdFromMessages = (messages: any[]) => {
    if (!Array.isArray(messages) || messages.length === 0) return null;
    const last = messages[messages.length - 1] || {};
    const senderRole = String(last?.senderrole || last?.senderRole || '').toLowerCase();
    const receiverRole = String(last?.receiverrole || last?.receiverRole || '').toLowerCase();
    const senderId = last?.senderId ?? last?.senderid;
    const receiverId = last?.receiverId ?? last?.receiverid;

    if (userType === 'nakliyeci' || userType === 'tasiyici') {
      // We are the carrier side -> other is shipper
      if (senderRole === 'individual' || senderRole === 'corporate') return senderId ?? null;
      if (receiverRole === 'individual' || receiverRole === 'corporate') return receiverId ?? null;
    } else {
      // We are shipper side -> other is carrier
      if (senderRole === 'nakliyeci' || senderRole === 'carrier' || senderRole === 'tasiyici' || senderRole === 'driver') return senderId ?? null;
      if (receiverRole === 'nakliyeci' || receiverRole === 'carrier' || receiverRole === 'tasiyici' || receiverRole === 'driver') return receiverId ?? null;
    }
    return senderId ?? receiverId ?? null;
  };

  const loadShipmentConversation = async (shipmentId: string, seed?: Conversation) => {
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) return;

      const url = createApiUrl(`/api/messages/shipment/${shipmentId}`);
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!resp.ok) return;
      const j = await resp.json().catch(() => null);
      const raw = j?.data || j?.messages || [];
      const rows = Array.isArray(raw) ? raw : [];

      const currentUserId = getCurrentUserId();
      const isSameUser = (id: any) => {
        if (!id || !currentUserId) return false;
        return String(id) === String(currentUserId);
      };

      const lastRaw = rows[rows.length - 1] || {};
      const senderId = lastRaw?.senderId ?? lastRaw?.senderid ?? lastRaw?.sender_id;
      const receiverId = lastRaw?.receiverId ?? lastRaw?.receiverid ?? lastRaw?.receiver_id;
      const senderName = String(lastRaw?.senderName ?? lastRaw?.sendername ?? lastRaw?.sender_name ?? '').trim();
      const receiverName = String(lastRaw?.receiverName ?? lastRaw?.receivername ?? lastRaw?.receiver_name ?? '').trim();
      const otherUserIdFromRows = isSameUser(senderId) ? receiverId : senderId;
      const otherUserNameFromRows = isSameUser(senderId) ? receiverName : senderName;

      const otherUserId = deriveOtherUserIdFromMessages(rows);
      const uiMessages = rows.map(mapApiMessageToUi).filter(m => m.message);
      const lastUi = uiMessages.length ? uiMessages[uiMessages.length - 1] : null;

      const fallbackName =
        seed?.carrierName ||
        seed?.participant ||
        String(otherUserNameFromRows || '').trim() ||
        getOtherUserLabel();

      const resolvedOtherId =
        seed?.otherUserId ||
        seed?.participantId ||
        seed?.carrierId ||
        (otherUserIdFromRows != null ? String(otherUserIdFromRows) : (otherUserId != null ? String(otherUserId) : undefined));

      const trackingNumber =
        seed?.trackingNumber ||
        toTrackingCode(undefined, shipmentId);

      const conv: Conversation = {
        id: seed?.id || `thread-${String(resolvedOtherId || 'unknown')}-shipment-${shipmentId}`,
        shipmentId,
        otherUserId: resolvedOtherId,
        carrierId: resolvedOtherId,
        participantId: resolvedOtherId,
        carrierName: fallbackName,
        carrierCompany: seed?.carrierCompany,
        participant: fallbackName,
        lastMessage: lastUi?.message || '',
        lastMessageTime: lastUi?.timestamp || '',
        unreadCount: 0,
        isOnline: false,
        isArchived: seed?.isArchived,
        messages: uiMessages,
        trackingNumber,
        status: seed?.status,
      };

      setConversations(prev => {
        const exists = prev.some(p => String(p.id) === String(conv.id));
        return exists ? prev.map(p => (String(p.id) === String(conv.id) ? { ...p, ...conv } : p)) : [conv, ...prev];
      });
      setSelectedConversation(conv);
    } catch (e) {
      console.error('Shipment conversation load failed:', e);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    if (conversation.shipmentId) {
      loadShipmentConversation(String(conversation.shipmentId), conversation);
    }
  };

  useEffect(() => {
    const value = (prefillParam || '').trim();
    if (value) setNewMessage(value);
  }, [prefillParam]);

  useEffect(() => {
    if (!shipmentIdParam) return;
    // Ensure we can open messages by shipment context even when conversation list API doesn't include shipmentId.
    const seed = userIdParam
      ? {
          id: `thread-${userIdParam}-shipment-${shipmentIdParam}`,
          otherUserId: userIdParam,
          carrierId: userIdParam,
          participantId: userIdParam,
          shipmentId: shipmentIdParam,
          carrierName: getOtherUserLabel(),
          participant: getOtherUserLabel(),
          lastMessage: '',
          lastMessageTime: '',
        }
      : undefined;
    loadShipmentConversation(String(shipmentIdParam), seed);
  }, [shipmentIdParam, loadShipmentConversation]);

  useEffect(() => {
    if (!userIdParam) return;
    const found = conversations.find(c => String(c.otherUserId || c.carrierId || c.participantId) === String(userIdParam));
    if (found) {
      handleSelectConversation(found);
    } else if (shipmentIdParam) {
      const temp: Conversation = {
        id: `thread-${userIdParam}-shipment-${shipmentIdParam}`,
        otherUserId: userIdParam,
        carrierId: userIdParam,
        participantId: userIdParam,
        shipmentId: shipmentIdParam,
        carrierName: getOtherUserLabel(),
        participant: getOtherUserLabel(),
        lastMessage: '',
        lastMessageTime: '',
        unreadCount: 0,
        isOnline: false,
        messages: [],
      };
      handleSelectConversation(temp);
      setConversations(prev => (prev.find(p => String(p.otherUserId || p.carrierId || p.participantId) === String(userIdParam)) ? prev : [...prev, temp]));
    }
    setTimeout(() => {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('userId');
        next.delete('prefill');
        if (shipmentIdParam) next.set('shipmentId', shipmentIdParam);
        return next;
      });
    }, 100);
  }, [userIdParam, shipmentIdParam, conversations, setSearchParams]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      if (!token) {
        setConversations([]);
        return;
      }

      let apiUrl = '';
      switch (userType) {
        case 'corporate':
          apiUrl = createApiUrl('/api/messages/corporate');
          break;
        case 'individual':
          {
            const response = await messageAPI.getAll();
            const raw = response.success && response.data ? response.data : [];
            const base = Array.isArray(raw) ? raw : [];
            setConversations(normalizeConversations(base.map(mapApiConversationToUi)));
            setLoading(false);
            return;
          }
        case 'nakliyeci':
        case 'tasiyici':
          apiUrl = createApiUrl('/api/messages');
          break;
        default:
          apiUrl = createApiUrl('/api/messages');
      }

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Konuşmalar yüklenemedi');
      }

      const data = await response.json();
      const convsRaw = data?.conversations || data?.data || data?.messages || [];
      const baseConvs = Array.isArray(convsRaw) ? convsRaw : [];

      setConversations(normalizeConversations(baseConvs.map(mapApiConversationToUi)));
    } catch (error) {
      console.error('Konuşmalar yüklenirken hata:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadConversations().finally(() => {
      setIsRefreshing(false);
    });
  };

  // 🛡️ Mesaj güvenlik filtresi
  const checkMessageContent = (message: string): boolean => {
    const inappropriateWords = [
      'mal', 'aptal', 'salak', 'ahmak', 'gerizekalı', 'budala',
      'kapat', 'sus', 'defol', 'siktir', 'amk', 'mk', 'aq',
      'orospu', 'piç', 'ibne', 'geber', 'öl', 'geberin'
    ];
    
    const lowerMessage = message.toLowerCase();
    const hasInappropriate = inappropriateWords.some(word => lowerMessage.includes(word));
    
    if (hasInappropriate) {
      showToast('🙅 Lütfen kibarca iletişim kurun. Profesyonel bir iş platformundayız.', 'error');
      return false;
    }
    
    return true;
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    
    // Mesaj içerik kontrolü
    if (!checkMessageContent(newMessage)) {
      return;
    }

    if (!selectedConversation) {
      showToast('Lütfen bir sohbet ve mesaj seçin', 'error');
      return;
    }

    setSendingMessage(true);
    const originalMessage = newMessage;
    setNewMessage('');

    const messageText = (originalMessage || '').trim();

    const temp: Message = {
      id: `temp-${Date.now()}`,
      from: 'Siz',
      fromType: 'carrier',
      message: messageText,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      isRead: false,
      status: 'sending',
    };

    setSelectedConversation(prev =>
      prev ? { ...prev, messages: [...(prev.messages || []), temp], lastMessage: temp.message, lastMessageTime: temp.timestamp } : prev
    );

    try {
      const currentUserId = getCurrentUserId();

      const isSameUser = (id: any) => {
        if (!id || !currentUserId) return false;
        return String(id) === String(currentUserId);
      };

      const pickReceiverFromShipment = async (shipmentId: string | number) => {
        const token = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!token) return '';

        try {
          const res = await fetch(createApiUrl(`/api/shipments/${shipmentId}`), {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (!res.ok) return '';

          const data = await res.json();
          const raw = data?.shipment || data?.data?.shipment || data?.data || data;
          if (!raw) return '';

          // 🔒 İş Durumu Kontrolü: Sadece onaylı işlerde mesajlaşmaya izin ver
          const jobStatus = (raw.status || '').toLowerCase().trim();
          const allowedStatuses = ['accepted', 'assigned', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed'];
          
          if (!allowedStatuses.includes(jobStatus)) {
            throw new Error(`Mesajlaşma için iş onaylanması gerekiyor. Mevcut durum: ${jobStatus}`);
          }

          // Messaging topology:
          // - tasiyici (driver) <-> nakliyeci (carrier) is allowed
          // - shipper <-> carrier is allowed
          // - shipper <-> tasiyici direct messaging is NOT allowed (backend 403)
          // So pick receiver based on current panel userType.

          const shipperCandidates = [
            raw.userId,
            raw.userid,
            raw.user_id,
            raw.ownerId,
            raw.owner_id,
            raw.senderId,
            raw.sender_id,
            raw.corporateId,
            raw.corporate_id,
            raw.individualId,
            raw.individual_id,
          ].filter(Boolean);

          const carrierCandidates = [
            raw.carrierId,
            raw.carrierid,
            raw.carrier_id,
            raw.nakliyeciId,
            raw.nakliyeciid,
            raw.nakliyeci_id,
            raw.assignedCarrierId,
            raw.assigned_carrier_id,
          ].filter(Boolean);

          const preferred = userType === 'tasiyici' ? carrierCandidates : shipperCandidates;
          const firstOther = preferred.find((c: any) => !isSameUser(c));
          if (firstOther) return String(firstOther);

          const fallback = (userType === 'tasiyici' ? shipperCandidates : carrierCandidates).find((c: any) => !isSameUser(c));
          return fallback ? String(fallback) : '';
        } catch (_) {
          return '';
        }
      };

      // Try multiple possible receiver ID fields
      let receiverId: any =
        selectedConversation.otherUserId ||
        selectedConversation.participantId ||
        selectedConversation.carrierId;

      if (!receiverId || isSameUser(receiverId)) {
        const shipmentId = selectedConversation.shipmentId;
        if (shipmentId) {
          const resolved = await pickReceiverFromShipment(shipmentId);
          if (resolved) receiverId = resolved;
        }
      }

      if (!receiverId || isSameUser(receiverId)) {
        throw new Error('Alıcı bilgisi bulunamadı, sohbeti yeniden başlat.');
      }

      // 🔒 İş Durumu Final Kontrolü
      if (selectedConversation.shipmentId) {
        try {
          const token = localStorage.getItem('authToken') || localStorage.getItem('token');
          const statusRes = await fetch(createApiUrl(`/api/shipments/${selectedConversation.shipmentId}`), {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            const shipment = statusData?.shipment || statusData?.data?.shipment || statusData?.data || statusData;
            const currentStatus = (shipment?.status || '').toLowerCase().trim();
            const allowedForMessaging = ['accepted', 'assigned', 'in_progress', 'picked_up', 'in_transit', 'delivered', 'completed'];
            
            if (!allowedForMessaging.includes(currentStatus)) {
              throw new Error(`Mesajlaşma henüz aktif değil. İş durumu: ${currentStatus}. Onay bekle.`);
            }
          }
        } catch (validationError: any) {
          if (validationError.message.includes('mesajlaşma')) {
            throw validationError;
          }
          // Diğer hatalar için devam et (network vb.)
        }
      }

      await messageAPI.send({
        receiverId: String(receiverId),
        message: messageText,
        shipmentId: selectedConversation.shipmentId ? String(selectedConversation.shipmentId) : undefined,
      });

      const sent: Message = { ...temp, id: `sent-${Date.now()}`, status: 'sent' };
      setSelectedConversation(prev =>
        prev ? { ...prev, messages: (prev.messages || []).map(m => (m.id === temp.id ? sent : m)), lastMessage: sent.message, lastMessageTime: sent.timestamp } : prev
      );
      showToast('Mesaj gönderildi', 'success');
    } catch (err: any) {
      console.error('Mesaj gönderilirken hata:', err);
      setSelectedConversation(prev => (prev ? { ...prev, messages: (prev.messages || []).filter(m => m.id !== temp.id) } : prev));
      setNewMessage(originalMessage);
      showToast(err?.message || 'Mesaj gönderilemedi', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    const confirm = window.confirm('Bu sohbeti silmek istediğinize emin misiniz?');
    if (!confirm) return;
    try {
      const otherUserId = selectedConversation.otherUserId || selectedConversation.carrierId || selectedConversation.participantId;
      if (otherUserId) {
        await messageAPI.deleteConversation(String(otherUserId));
      }

      setConversations(prev => {
        if (!otherUserId) return prev.filter(conv => conv.id !== selectedConversation.id);
        return prev.filter(conv => String(conv.otherUserId || conv.carrierId || conv.participantId || '') !== String(otherUserId));
      });
      setSelectedConversation(null);
      showToast('Sohbet silindi', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Sohbet silinemedi', 'error');
    }
  };

  const handleToggleArchive = async (conversationId: string | number) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;
    
    const newArchivedStatus = !conv.isArchived;
    try {
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, isArchived: newArchivedStatus } : c
      ));
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
      
      showToast(`Sohbet ${newArchivedStatus ? 'arşivlendi' : 'arşivden çıkarıldı'}`, 'success');
    } catch (error) {
      showToast('İşlem başarısız', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredConversations = conversations.filter(conv => {
    const q = (searchTerm || '').toLowerCase();
    const name = conv.carrierName || conv.participant || '';
    const company = conv.carrierCompany || '';
    const shipmentText = String(conv.shipmentId ?? '');
    const trackingText = String(conv.trackingNumber ?? '');
    const matchesSearch =
      name.toLowerCase().includes(q) ||
      company.toLowerCase().includes(q) ||
      shipmentText.toLowerCase().includes(q) ||
      trackingText.toLowerCase().includes(q);
    const matchesTab = activeTab === 'archived' ? (conv.isArchived === true) : (conv.isArchived !== true);
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        <div className='max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6'>
          <LoadingState message='Mesajlar yükleniyor...' />
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
      <Helmet>
        <title>Mesajlar - YolNext {getUserTypeLabel()}</title>
        <meta name='description' content={`${getUserTypeLabel()} mesajları`} />
      </Helmet>

      <div className='max-w-7xl mx-auto px-4 py-6'>
        {/* Professional Header */}
        <div className='text-center mb-12'>
          <div className='flex justify-center mb-6'>
            <div className='w-20 h-20 bg-gradient-to-br from-slate-800 to-blue-900 rounded-3xl flex items-center justify-center shadow-2xl'>
              <MessageCircle className='w-10 h-10 text-white' />
            </div>
          </div>
          <h1 className='text-5xl md:text-6xl font-bold text-slate-900 mb-4'>
            Mesajlar{' '}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-blue-900'>
              & İletişim
            </span>
          </h1>
          <p className='text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed'>
            {getOtherUserLabel()}lerinizle profesyonel iletişim kurun ve gönderilerinizi takip edin
          </p>
        </div>

        <div className='mb-6'>
          <GuidanceOverlay
            storageKey={`${userType}.messages`}
            isEmpty={!loading && conversations.length === 0}
            icon={MessageCircle}
            title='Şimdi ne yapmalısın?'
            description={
              userType === 'tasiyici'
                ? 'Nakliyeci ile yükleme/talimat ve işin durumunu burada netleştir. Konuşmayı seçip kısa mesajlarla hızlıca bilgi ver.'
                : 'Teklif kabul ettiyseniz operasyon detaylarını burada netleştirin. Yeni konuşma başlatmak için ilgili sayfalardan gönderiyi açıp mesajlaşmaya geçebilirsiniz.'
            }
            primaryAction={{
              label:
                userType === 'tasiyici'
                  ? 'İş Pazarı'
                  : userType === 'corporate' || userType === 'individual'
                    ? 'Gönderilerim'
                    : 'İlanlarım',
              to:
                userType === 'tasiyici'
                  ? '/tasiyici/market'
                  : userType === 'corporate'
                    ? '/corporate/shipments'
                    : userType === 'individual'
                      ? '/individual/my-shipments'
                      : `/${userType}/listings`,
            }}
            secondaryAction={{
              label: userType === 'tasiyici' ? 'Tekliflerim' : 'Teklifler',
              to: userType === 'tasiyici' ? '/tasiyici/my-offers' : `/${userType}/offers`,
            }}
          />
        </div>

        {/* Main Content */}
        <div className='bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden'>
          {/* Professional Action Bar */}
          <div className='bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 px-8 py-6'>
            <div className='flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center'>
              <div className='flex items-center gap-4'>
                <div>
                  <h2 className='text-2xl font-bold text-slate-900'>
                    Mesaj Merkezi
                  </h2>
                  <p className='text-slate-600'>
                    {getOtherUserLabel()}lerinizle gerçek zamanlı iletişim
                  </p>
                </div>
                <div className='hidden lg:block w-px h-12 bg-slate-300'></div>
                <div className='flex items-center gap-2 text-sm text-slate-500'>
                  <Clock className='w-4 h-4' />
                  Son güncelleme: {new Date().toLocaleString('tr-TR')}
                </div>
              </div>

              <div className='flex flex-wrap gap-3'>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className='flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50'
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  Yenile
                </button>
              </div>
            </div>
          </div>

          <div className='flex flex-col lg:flex-row h-[600px]' style={{ minHeight: '600px' }}>
            {/* Conversations List - Mobilde seçili konuşma varsa gizlenir */}
            <div className={`w-full lg:w-1/3 border-r border-slate-200 bg-slate-50 ${selectedConversation ? 'hidden lg:block' : 'block'}`} style={{ minHeight: '600px' }}>
              {/* Tabs */}
              <div className='p-4 border-b border-slate-200'>
                <div className='bg-white p-1 rounded-lg shadow-sm'>
                  <button
                    onClick={() => setActiveTab('active')}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'active'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Mesajlar ({conversations.filter(c => !c.isArchived).length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className='p-4 border-b border-slate-200'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4' />
                  <input
                    type='text'
                    placeholder={`${getOtherUserLabel()} veya gönderi ara...`}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm'
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className='flex-1 overflow-y-auto' style={{ maxHeight: '400px' }}>
                {filteredConversations.length === 0 ? (
                  <div className='flex flex-col items-center justify-center h-full p-8 text-center'>
                    <MessageCircle className='w-16 h-16 text-slate-300 mb-4' />
                    <h3 className='text-lg font-semibold text-slate-600 mb-2'>
                      💬 Henüz mesaj yok
                    </h3>
                    <p className='text-slate-500 text-sm'>
                      {getOtherUserLabel()}lerinizle mesajlaşmaya başla
                    </p>
                  </div>
                ) : (
                  filteredConversations.map(conversation => (
                    <div
                      key={String(conversation.id)}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 border-b border-slate-200 cursor-pointer transition-all hover:bg-white ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-white border-r-4 border-r-blue-500'
                          : ''
                      }`}
                    >
                      <div className='flex items-start gap-3'>
                        <div className='relative'>
                          <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg'>
                            {(conversation.carrierName || conversation.participant || getOtherUserLabel()).charAt(0).toUpperCase()}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              conversation.isOnline
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          ></div>
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-center justify-between mb-1'>
                            <h3 className='font-semibold text-slate-900 truncate'>
                              {conversation.carrierName || conversation.participant || getOtherUserLabel()}
                            </h3>
                            <div className='flex items-center gap-1'>
                              {conversation.unreadCount && conversation.unreadCount > 0 && (
                                <div className='w-5 h-5 bg-gradient-to-r from-slate-800 to-blue-900 text-white text-xs rounded-full flex items-center justify-center'>
                                  {conversation.unreadCount}
                                </div>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleArchive(conversation.id);
                                }}
                                className='p-1 text-slate-400 hover:text-slate-600 transition-colors'
                                title={conversation.isArchived ? 'Arşivden çıkar' : 'Arşivle'}
                              >
                                <Archive className='w-4 h-4' />
                              </button>
                            </div>
                          </div>

                          <div className='text-sm text-slate-600 mb-2 truncate'>
                            {conversation.trackingNumber || ''}
                          </div>

                          <div className='flex items-center justify-between'>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                conversation.status === 'Yolda'
                                  ? 'bg-blue-100 text-blue-700'
                                  : conversation.status === 'Teslim Edildi'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {conversation.status || 'Aktif'}
                            </span>
                            <span className='text-xs text-slate-500'>
                              {conversation.lastMessageTime}
                            </span>
                          </div>

                          <div className='flex items-center justify-between mt-2'>
                            <p className='text-sm text-slate-600 truncate flex-1'>
                              {conversation.lastMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area - Mobilde tam genişlik */}
            <div className={`w-full lg:flex-1 flex flex-col ${selectedConversation ? 'block' : 'hidden lg:block'}`} style={{ minHeight: '600px' }}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className='p-4 sm:p-6 border-b border-slate-200 bg-white'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2 sm:gap-4 flex-1'>
                        {/* Mobilde geri butonu */}
                        <button
                          onClick={() => setSelectedConversation(null)}
                          className='lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors'
                        >
                          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
                          </svg>
                        </button>
                        <div className='relative'>
                          <div className='w-12 h-12 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg'>
                            {(selectedConversation.carrierName || selectedConversation.participant || getOtherUserLabel()).charAt(0).toUpperCase()}
                          </div>
                          <div
                            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              selectedConversation.isOnline
                                ? 'bg-emerald-500'
                                : 'bg-slate-400'
                            }`}
                          ></div>
                        </div>
                        <div>
                          <h3 className='text-lg font-bold text-slate-900'>
                            {selectedConversation.carrierName || selectedConversation.participant || getOtherUserLabel()}
                          </h3>
                          <p className='text-sm text-slate-500'>
                            {selectedConversation.carrierCompany || 'Şirket bilgisi yok'}
                          </p>
                        </div>
                      </div>

                      <div className='flex items-center gap-2'>
                        <button
                          onClick={handleDeleteConversation}
                          className='px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:text-red-700 hover:bg-red-50 transition hidden sm:block'
                        >
                          Sohbeti Sil
                        </button>
                      </div>
                    </div>

                    {/* Shipment Info */}
                    {selectedConversation.shipmentId && (
                      <div className='p-4 bg-slate-50 border-b border-slate-200'>
                        <div className='flex items-center justify-between'>
                          <div>
                            <h4 className='font-semibold text-slate-900'>
                              Gönderi {toTrackingCode(selectedConversation.trackingNumber, selectedConversation.shipmentId)}
                            </h4>
                            <div className='flex items-center gap-4 mt-1'>
                              <div className='flex items-center gap-1 text-sm text-slate-600'>
                                <Package className='w-4 h-4' />
                                {toTrackingCode(selectedConversation.trackingNumber, selectedConversation.shipmentId) || 'Takip No'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='flex-1 overflow-y-auto p-6 space-y-4' style={{ maxHeight: '400px' }}>
                    {(selectedConversation.messages || []).map((message, index) => {
                      const currentDate = new Date(message.createdAt || Date.now()).toDateString();
                      const prevDate =
                        index > 0 ? new Date((selectedConversation.messages || [])[index - 1].createdAt || Date.now()).toDateString() : null;
                      const showDateSeparator = currentDate !== prevDate;
                      return (
                        <React.Fragment key={message.id}>
                          {showDateSeparator && (
                            <div className='flex items-center justify-center my-4'>
                              <div className='px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600'>
                                {new Date(message.createdAt || Date.now()).toLocaleDateString('tr-TR', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </div>
                            </div>
                          )}
                          <div className={`flex ${message.from === 'Siz' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.from === 'Siz'
                                  ? 'bg-gradient-to-r from-slate-800 to-blue-900 text-white'
                                  : message.fromType === 'system'
                                    ? 'bg-slate-100 text-slate-900'
                                    : 'bg-slate-200 text-slate-900'
                              }`}
                              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
                            >
                              <p className='text-sm whitespace-pre-wrap' style={{ wordBreak: 'break-word' }}>{message.message}</p>
                              <div className='flex items-center justify-between mt-1'>
                                <p className={`text-xs ${message.from === 'Siz' ? 'text-blue-100' : 'text-slate-500'}`}>{message.timestamp}</p>
                                {message.from === 'Siz' && message.status && (
                                  <div className='ml-2'>
                                    {message.status === 'sending' && <Clock className='w-3 h-3 text-blue-100' />}
                                    {message.status === 'sent' && <Check className='w-3 h-3 text-blue-100' />}
                                    {message.status === 'delivered' && <CheckCheck className='w-3 h-3 text-blue-100' />}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  <div className='p-6 border-t border-slate-200 space-y-3'>
                    <div className='flex flex-wrap gap-2'>
                      {quickMessagesForUser.map(msg => (
                        <button
                          key={msg}
                          onClick={() => setNewMessage(msg)}
                          className='px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 text-slate-700 rounded-md hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors'
                        >
                          {msg}
                        </button>
                      ))}
                    </div>

                    <div className='flex gap-3'>
                      <input
                        type='text'
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                        placeholder='Mesajınızı yazın...'
                        className='flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm'
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        className='px-6 py-3 bg-gradient-to-r from-slate-800 to-blue-900 text-white rounded-xl hover:from-blue-900 hover:to-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2'
                      >
                        {sendingMessage ? (
                          <span className='text-sm'>Gönderiliyor...</span>
                        ) : (
                          <>
                            <Send className='w-4 h-4' />
                            Gönder
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className='flex items-center justify-center h-full'>
                  <div className='text-center'>
                    <MessageCircle className='w-16 h-16 text-slate-300 mx-auto mb-4' />
                    <h3 className='text-lg font-semibold text-slate-600 mb-2'>
                      Sohbet Seçin
                    </h3>
                    <p className='text-slate-500'>
                      Görüntülemek istediğiniz konuşmayı seçin
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className='fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5'>
          <div
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-green-500 text-white' : toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className='w-5 h-5' />}
            {toast.type === 'error' && <AlertCircle className='w-5 h-5' />}
            {toast.type === 'info' && <Bell className='w-5 h-5' />}
            <p className='text-sm font-medium'>{toast.message}</p>
            <button onClick={() => setToast(null)} className='ml-2 hover:opacity-75 transition-opacity'>
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}











