import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Workflow, CheckCircle, Clock, AlertCircle, User, Calendar, Plus, Edit, Trash2 } from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  assignee: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  dependencies: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WorkflowManagement() {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([
    {
      id: '1',
      name: 'Gönderi Onay Süreci',
      description: 'Yeni gönderi taleplerinin onay süreci',
      isActive: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15',
      steps: [
        {
          id: '1-1',
          name: 'Gönderi Kontrolü',
          description: 'Gönderi bilgilerinin kontrol edilmesi',
          assignee: 'Lojistik Ekibi',
          status: 'completed',
          dueDate: '2024-01-16',
          priority: 'high',
          dependencies: []
        },
        {
          id: '1-2',
          name: 'Fiyat Onayı',
          description: 'Fiyat teklifinin onaylanması',
          assignee: 'Mali İşler',
          status: 'in-progress',
          dueDate: '2024-01-17',
          priority: 'high',
          dependencies: ['1-1']
        },
        {
          id: '1-3',
          name: 'Nakliyeci Ataması',
          description: 'Uygun nakliyecinin atanması',
          assignee: 'Operasyon Ekibi',
          status: 'draft',
          dueDate: '2024-01-18',
          priority: 'medium',
          dependencies: ['1-2']
        }
      ]
    },
    {
      id: '2',
      name: 'Nakliyeci Onay Süreci',
      description: 'Yeni nakliyeci başvurularının değerlendirilmesi',
      isActive: true,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-10',
      steps: [
        {
          id: '2-1',
          name: 'Belge Kontrolü',
          description: 'Nakliyeci belgelerinin kontrol edilmesi',
          assignee: 'İnsan Kaynakları',
          status: 'completed',
          dueDate: '2024-01-11',
          priority: 'high',
          dependencies: []
        },
        {
          id: '2-2',
          name: 'Araç Kontrolü',
          description: 'Araç durumunun kontrol edilmesi',
          assignee: 'Teknik Ekibi',
          status: 'in-progress',
          dueDate: '2024-01-12',
          priority: 'high',
          dependencies: ['2-1']
        },
        {
          id: '2-3',
          name: 'Sözleşme İmzalanması',
          description: 'Nakliyeci sözleşmesinin imzalanması',
          assignee: 'Hukuk Müşaviri',
          status: 'draft',
          dueDate: '2024-01-13',
          priority: 'medium',
          dependencies: ['2-2']
        }
      ]
    }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in-progress':
        return <Clock className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Workflow Yönetimi - YolNet</title>
        <meta name="description" content="YolNet workflow yönetim sistemi" />
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflow Yönetimi</h1>
            <p className="text-gray-600 mt-2">İş süreçlerinizi yönetin ve otomatikleştirin</p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Yeni Workflow
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workflow List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Workflow Şablonları</h2>
              </div>
              <div className="p-4 space-y-3">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    onClick={() => setSelectedWorkflow(workflow)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedWorkflow?.id === workflow.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {workflow.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{workflow.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{workflow.steps.length} adım</span>
                      <span>•</span>
                      <span>{workflow.updatedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workflow Details */}
          <div className="lg:col-span-2">
            {selectedWorkflow ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedWorkflow.name}</h2>
                      <p className="text-gray-600 mt-1">{selectedWorkflow.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-600 hover:text-gray-900">
                        <Edit size={20} />
                      </button>
                      <button className="p-2 text-red-600 hover:text-red-900">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Workflow Adımları</h3>
                  <div className="space-y-4">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{step.name}</h4>
                              <p className="text-sm text-gray-600">{step.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${getStatusColor(step.status)}`}>
                              {getStatusIcon(step.status)}
                              {step.status === 'in-progress' ? 'Devam Ediyor' : 
                               step.status === 'completed' ? 'Tamamlandı' :
                               step.status === 'draft' ? 'Taslak' : 'İptal Edildi'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(step.priority)}`}>
                              {step.priority === 'high' ? 'Yüksek' :
                               step.priority === 'medium' ? 'Orta' : 'Düşük'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User size={16} />
                            <span>{step.assignee}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>{step.dueDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Workflow size={16} />
                            <span>{step.dependencies.length} bağımlılık</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Workflow className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Workflow Seçin</h3>
                <p className="text-gray-600">Detaylarını görmek için bir workflow seçin</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}