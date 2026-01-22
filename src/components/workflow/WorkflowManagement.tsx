import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  ArrowDown,
  Users,
  Package,
  Truck,
  MessageSquare,
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automatic' | 'approval';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedTo?: string;
  estimatedTime: number;
  dependencies: string[];
  actions: WorkflowAction[];
}

interface WorkflowAction {
  id: string;
  name: string;
  type: 'button' | 'form' | 'approval';
  status: 'enabled' | 'disabled' | 'completed';
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed' | 'failed';
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

const WorkflowManagement: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Gönderi Oluşturma',
      description: 'Yeni gönderi oluşturma süreci',
      status: 'active',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
      steps: [
        {
          id: 'step1',
          name: 'Gönderi Bilgileri',
          description: 'Temel gönderi bilgilerini gir',
          type: 'manual',
          status: 'completed',
          estimatedTime: 5,
          dependencies: [],
          actions: [
            {
              id: 'fill_form',
              name: 'Formu Doldur',
              type: 'form',
              status: 'completed',
            },
            {
              id: 'validate',
              name: 'Doğrula',
              type: 'button',
              status: 'completed',
            },
          ],
        },
        {
          id: 'step2',
          name: 'Adres Bilgileri',
          description: 'Alış ve teslim adreslerini belirle',
          type: 'manual',
          status: 'in_progress',
          estimatedTime: 3,
          dependencies: ['step1'],
          actions: [
            {
              id: 'select_addresses',
              name: 'Adresleri Seç',
              type: 'form',
              status: 'enabled',
            },
            {
              id: 'calculate_distance',
              name: 'Mesafe Hesapla',
              type: 'button',
              status: 'enabled',
            },
          ],
        },
        {
          id: 'step3',
          name: 'Teklif Alma',
          description: 'Nakliyeci tekliflerini bekle',
          type: 'automatic',
          status: 'pending',
          estimatedTime: 30,
          dependencies: ['step2'],
          actions: [
            {
              id: 'send_requests',
              name: 'Teklif İste',
              type: 'button',
              status: 'disabled',
            },
            {
              id: 'review_offers',
              name: 'Teklifleri İncele',
              type: 'form',
              status: 'disabled',
            },
          ],
        },
        {
          id: 'step4',
          name: 'Onay',
          description: 'En uygun teklifi seç ve onayla',
          type: 'approval',
          status: 'pending',
          assignedTo: 'user@example.com',
          estimatedTime: 10,
          dependencies: ['step3'],
          actions: [
            {
              id: 'select_offer',
              name: 'Teklif Seç',
              type: 'form',
              status: 'disabled',
            },
            {
              id: 'approve',
              name: 'Onayla',
              type: 'approval',
              status: 'disabled',
            },
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'Nakliyeci Onayı',
      description: 'Nakliyeci başvuru onay süreci',
      status: 'active',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-18',
      steps: [
        {
          id: 'step1',
          name: 'Başvuru İnceleme',
          description: 'Nakliyeci başvurusunu incele',
          type: 'manual',
          status: 'completed',
          assignedTo: 'admin@example.com',
          estimatedTime: 15,
          dependencies: [],
          actions: [
            {
              id: 'review_documents',
              name: 'Belgeleri İncele',
              type: 'form',
              status: 'completed',
            },
            {
              id: 'check_references',
              name: 'Referansları Kontrol Et',
              type: 'button',
              status: 'completed',
            },
          ],
        },
        {
          id: 'step2',
          name: 'Onay',
          description: 'Başvuruyu onayla veya reddet',
          type: 'approval',
          status: 'in_progress',
          assignedTo: 'admin@example.com',
          estimatedTime: 5,
          dependencies: ['step1'],
          actions: [
            {
              id: 'approve',
              name: 'Onayla',
              type: 'approval',
              status: 'enabled',
            },
            {
              id: 'reject',
              name: 'Reddet',
              type: 'approval',
              status: 'enabled',
            },
          ],
        },
      ],
    },
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='w-4 h-4' />;
      case 'in_progress':
        return <Clock className='w-4 h-4' />;
      case 'pending':
        return <Clock className='w-4 h-4' />;
      case 'failed':
        return <AlertCircle className='w-4 h-4' />;
      default:
        return <Clock className='w-4 h-4' />;
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case 'manual':
        return <Users className='w-4 h-4' />;
      case 'automatic':
        return <Settings className='w-4 h-4' />;
      case 'approval':
        return <CheckCircle className='w-4 h-4' />;
      default:
        return <Package className='w-4 h-4' />;
    }
  };

  const handleStepAction = (
    workflowId: string,
    stepId: string,
    actionId: string
  ) => {
    setWorkflows(prev =>
      prev.map(workflow => {
        if (workflow.id === workflowId) {
          return {
            ...workflow,
            steps: workflow.steps.map(step => {
              if (step.id === stepId) {
                return {
                  ...step,
                  actions: step.actions.map(action => {
                    if (action.id === actionId) {
                      return { ...action, status: 'completed' as const };
                    }
                    return action;
                  }),
                };
              }
              return step;
            }),
          };
        }
        return workflow;
      })
    );
  };

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4'>
        {/* Header */}
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>
              İş Akışı Yönetimi
            </h1>
            <p className='text-gray-600 mt-2'>
              Süreçleri tanımlayın, yönetin ve optimize edin
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className='bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center'
          >
            <Plus className='w-5 h-5 mr-2' />
            Yeni İş Akışı
          </button>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Workflows List */}
          <div className='lg:col-span-1'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>
              İş Akışları
            </h2>
            <div className='space-y-4'>
              {workflows.map(workflow => (
                <div
                  key={workflow.id}
                  onClick={() => setSelectedWorkflow(workflow)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedWorkflow?.id === workflow.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='font-semibold text-gray-900'>
                      {workflow.name}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : workflow.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : workflow.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {workflow.status === 'active'
                        ? 'Aktif'
                        : workflow.status === 'paused'
                          ? 'Duraklatıldı'
                          : workflow.status === 'completed'
                            ? 'Tamamlandı'
                            : 'Hatalı'}
                    </span>
                  </div>
                  <p className='text-sm text-gray-600 mb-3'>
                    {workflow.description}
                  </p>
                  <div className='flex items-center justify-between text-xs text-gray-500'>
                    <span>{workflow.steps.length} adım</span>
                    <span>{workflow.updatedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow Details */}
          <div className='lg:col-span-2'>
            {selectedWorkflow ? (
              <div className='bg-white rounded-2xl shadow-lg p-6'>
                <div className='flex items-center justify-between mb-6'>
                  <div>
                    <h2 className='text-2xl font-bold text-gray-900'>
                      {selectedWorkflow.name}
                    </h2>
                    <p className='text-gray-600'>
                      {selectedWorkflow.description}
                    </p>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button className='min-w-[44px] min-h-[44px] p-2 text-gray-600 hover:text-gray-800 flex items-center justify-center' aria-label='Düzenle'>
                      <Edit className='w-5 h-5' />
                    </button>
                    <button className='min-w-[44px] min-h-[44px] p-2 text-gray-600 hover:text-gray-800 flex items-center justify-center' aria-label='Ayarlar'>
                      <Settings className='w-5 h-5' />
                    </button>
                  </div>
                </div>

                {/* Workflow Steps */}
                <div className='space-y-4'>
                  {selectedWorkflow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className='border border-gray-200 rounded-lg p-4'
                    >
                      <div className='flex items-start justify-between mb-3'>
                        <div className='flex items-center space-x-3'>
                          <div className='flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-semibold'>
                            {index + 1}
                          </div>
                          <div>
                            <h3 className='font-semibold text-gray-900'>
                              {step.name}
                            </h3>
                            <p className='text-sm text-gray-600'>
                              {step.description}
                            </p>
                          </div>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(
                              step.status
                            )}`}
                          >
                            {getStatusIcon(step.status)}
                            <span className='ml-1'>
                              {step.status === 'completed'
                                ? 'Tamamlandı'
                                : step.status === 'in_progress'
                                  ? 'Devam Ediyor'
                                  : step.status === 'pending'
                                    ? 'Bekliyor'
                                    : 'Hatalı'}
                            </span>
                          </span>
                          <div className='flex items-center text-xs text-gray-500'>
                            {getStepTypeIcon(step.type)}
                            <span className='ml-1'>
                              {step.type === 'manual'
                                ? 'Manuel'
                                : step.type === 'automatic'
                                  ? 'Otomatik'
                                  : 'Onay'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Step Info */}
                      <div className='grid grid-cols-3 gap-4 mb-4 text-sm'>
                        <div>
                          <span className='text-gray-500'>Tahmini Süre:</span>
                          <span className='ml-2 font-medium'>
                            {step.estimatedTime} dk
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-500'>Atanan:</span>
                          <span className='ml-2 font-medium'>
                            {step.assignedTo || 'Atanmamış'}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-500'>Bağımlılık:</span>
                          <span className='ml-2 font-medium'>
                            {step.dependencies.length} adım
                          </span>
                        </div>
                      </div>

                      {/* Step Actions */}
                      <div className='space-y-2'>
                        <h4 className='text-sm font-medium text-gray-700'>
                          İşlemler:
                        </h4>
                        <div className='flex flex-wrap gap-2'>
                          {step.actions.map(action => (
                            <button
                              key={action.id}
                              onClick={() =>
                                handleStepAction(
                                  selectedWorkflow.id,
                                  step.id,
                                  action.id
                                )
                              }
                              disabled={
                                action.status === 'disabled' ||
                                action.status === 'completed'
                              }
                              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                action.status === 'completed'
                                  ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                  : action.status === 'disabled'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              }`}
                            >
                              {action.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Workflow Actions */}
                <div className='mt-6 pt-6 border-t border-gray-200'>
                  <div className='flex items-center space-x-4'>
                    <button className='flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors'>
                      <Play className='w-4 h-4 mr-2' />
                      Başlat
                    </button>
                    <button className='flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors'>
                      <Pause className='w-4 h-4 mr-2' />
                      Duraklat
                    </button>
                    <button className='flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors'>
                      <RotateCcw className='w-4 h-4 mr-2' />
                      Sıfırla
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className='bg-white rounded-2xl shadow-lg p-12 text-center'>
                <Settings className='w-16 h-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  İş Akışı Seçin
                </h3>
                <p className='text-gray-500'>
                  Detaylarını görmek için sol taraftan bir iş akışı seçin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManagement;
