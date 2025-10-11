import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  Check, 
  X, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,
  DollarSign,
  Truck,
  Package
} from 'lucide-react';

interface Contract {
  id: string;
  type: 'shipment' | 'carrier' | 'service';
  title: string;
  parties: {
    sender: string;
    carrier: string;
  };
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'expired';
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  terms: string[];
  documents: string[];
  createdAt: string;
  updatedAt: string;
}

interface ContractManagerProps {
  contracts: Contract[];
  onView: (contract: Contract) => void;
  onEdit: (contract: Contract) => void;
  onApprove: (contract: Contract) => void;
  onReject: (contract: Contract) => void;
  onDownload: (contract: Contract) => void;
}

const ContractManager: React.FC<ContractManagerProps> = ({
  contracts,
  onView,
  onEdit,
  onApprove,
  onReject,
  onDownload
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContracts = contracts.filter(contract => {
    const matchesStatus = selectedStatus === 'all' || contract.status === selectedStatus;
    const matchesType = selectedType === 'all' || contract.type === selectedType;
    const matchesSearch = contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contract.parties.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contract.parties.carrier.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-gray-600 bg-gray-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'expired':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Taslak';
      case 'pending':
        return 'Bekliyor';
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'expired':
        return 'Süresi Doldu';
      default:
        return 'Bilinmiyor';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'shipment':
        return 'Gönderi Sözleşmesi';
      case 'carrier':
        return 'Nakliyeci Sözleşmesi';
      case 'service':
        return 'Hizmet Sözleşmesi';
      default:
        return 'Sözleşme';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'shipment':
        return Package;
      case 'carrier':
        return Truck;
      case 'service':
        return FileText;
      default:
        return FileText;
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency === 'TRY' ? 'TRY' : 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const isExpiringSoon = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffInDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= 30 && diffInDays > 0;
  };

  const isExpired = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return end < now;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sözleşme Yönetimi</h1>
          <p className="text-gray-600">Sözleşmelerinizi görüntüleyin ve yönetin</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Yeni Sözleşme
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arama
            </label>
            <input
              type="text"
              placeholder="Sözleşme ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durum
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="pending">Bekliyor</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
              <option value="expired">Süresi Doldu</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tip
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Tipler</option>
              <option value="shipment">Gönderi Sözleşmesi</option>
              <option value="carrier">Nakliyeci Sözleşmesi</option>
              <option value="service">Hizmet Sözleşmesi</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Contracts List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Sözleşmeler ({filteredContracts.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredContracts.map((contract) => {
            const TypeIcon = getTypeIcon(contract.type);
            const isExpiring = isExpiringSoon(contract.endDate);
            const isExpiredContract = isExpired(contract.endDate);
            
            return (
              <div key={contract.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <TypeIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {contract.title}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                        {isExpiring && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-yellow-600 bg-yellow-100">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Süresi Doluyor
                          </span>
                        )}
                        {isExpiredContract && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full text-red-600 bg-red-100">
                            <Clock className="w-3 h-3 mr-1" />
                            Süresi Doldu
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        {getTypeText(contract.type)}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            <strong>Gönderen:</strong> {contract.parties.sender}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4" />
                          <span>
                            <strong>Nakliyeci:</strong> {contract.parties.carrier}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            <strong>Tutar:</strong> {formatCurrency(contract.amount, contract.currency)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            <strong>Başlangıç:</strong> {formatDate(contract.startDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            <strong>Bitiş:</strong> {formatDate(contract.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>
                            <strong>Belgeler:</strong> {contract.documents.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(contract)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Görüntüle"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEdit(contract)}
                      className="p-2 text-gray-600 hover:text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDownload(contract)}
                      className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="İndir"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {contract.status === 'pending' && (
                      <>
                        <button
                          onClick={() => onApprove(contract)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                          title="Onayla"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onReject(contract)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                          title="Reddet"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredContracts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Sözleşme bulunamadı
          </h3>
          <p className="text-gray-600 mb-4">
            Arama kriterlerinize uygun sözleşme bulunamadı.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Yeni Sözleşme Oluştur
          </button>
        </div>
      )}
    </div>
  );
};

export default ContractManager;

