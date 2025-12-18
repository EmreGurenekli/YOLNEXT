import { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Check, ArrowDown, ArrowUp, ArrowLeft, ArrowRight as ArrowRightIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

interface TutorialStep {
  title: string;
  description: string;
  menuItem?: string; // Menüdeki öğe adı
  menuPath?: string; // Menü path'i
  highlightType?: 'menu' | 'button' | 'dashboard'; // Ne tür bir öğe vurgulanacak
  position?: 'left' | 'right' | 'top' | 'bottom'; // Ok pozisyonu
}

interface DashboardTutorialProps {
  onComplete: () => void;
}

const DashboardTutorial: React.FC<DashboardTutorialProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [needsMenuOpen, setNeedsMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Detect window size changes
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if mobile (less than 1024px)
  const isMobile = windowWidth < 1024;

  useEffect(() => {
    // Check if user has seen tutorial
    const hasSeenTutorial = localStorage.getItem(`tutorial_seen_${user?.id}`);
    if (!hasSeenTutorial && user) {
      setIsVisible(true);
      // Check if menu needs to be opened on mobile
      if (isMobile) {
        checkMenuState();
      }
    }
  }, [user, isMobile]);

  // Check if mobile menu is open
  const checkMenuState = () => {
    if (!isMobile) return;

    const sidebar = document.querySelector('[data-testid="sidebar"]') as HTMLElement;
    if (sidebar) {
      const isOpen = !sidebar.classList.contains('-translate-x-full') ||
        sidebar.classList.contains('translate-x-0');
      setIsMobileMenuOpen(isOpen);
      setNeedsMenuOpen(!isOpen);
    } else {
      // Try alternative selectors
      const nav = document.querySelector('nav');
      if (nav) {
        const computedStyle = window.getComputedStyle(nav);
        const transform = computedStyle.transform;
        const isOpen = transform === 'none' || !transform.includes('-translate-x');
        setIsMobileMenuOpen(isOpen);
        setNeedsMenuOpen(!isOpen);
      }
    }
  };

  // Monitor menu state changes
  useEffect(() => {
    if (!isVisible || !isMobile) return;
    const checkInterval = setInterval(() => {
      checkMenuState();
    }, 300);
    return () => clearInterval(checkInterval);
  }, [isVisible, isMobile, currentStep]);

  useEffect(() => {
    if (isVisible && highlightedElement) {
      // Wait a bit for DOM to settle, then scroll
      const timer = setTimeout(() => {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });

        // Force a re-render after scroll to ensure correct positioning
        const currentStepData = steps[currentStep];
        if (currentStepData?.menuPath) {
          setTimeout(() => {
            const freshElement = document.querySelector(`a[href="${currentStepData.menuPath}"]`) as HTMLElement;
            if (freshElement && freshElement !== highlightedElement) {
              setHighlightedElement(freshElement);
            }
          }, 300);
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [currentStep, isVisible, highlightedElement]);

  const getTutorialSteps = (): TutorialStep[] => {
    const role = user?.role;

    switch (role) {
      case 'tasiyici':
        return [
          {
            title: 'İş Pazarı',
            description: 'Buraya tıklayarak nakliyecilerin işlerini görebilirsiniz',
            menuItem: 'İş Pazarı',
            menuPath: '/tasiyici/market',
            highlightType: 'menu',
            position: 'left'
          },
          {
            title: 'Tekliflerim',
            description: 'Verdiğiniz teklifleri buradan takip edin',
            menuItem: 'Tekliflerim',
            menuPath: '/tasiyici/my-offers',
            highlightType: 'menu',
            position: 'left'
          },
          {
            title: 'Aktif İşler',
            description: 'Kabul edilen işlerinizi buradan takip edin',
            menuItem: 'Aktif İşler',
            menuPath: '/tasiyici/active-jobs',
            highlightType: 'menu',
            position: 'left'
          },
          {
            title: 'Taşıyıcı Kodunuz',
            description: 'Ayarlar\'dan kodunuzu görebilirsiniz',
            menuItem: 'Ayarlar',
            menuPath: '/tasiyici/settings',
            highlightType: 'menu',
            position: 'left'
          }
        ];

      case 'nakliyeci':
        return [
          {
            title: 'Yük Pazarı',
            description: 'Buraya tıklayarak göndericilerden gelen işleri görün',
            menuItem: 'Yük Pazarı',
            menuPath: '/nakliyeci/jobs',
            highlightType: 'menu',
            position: 'left'
          },
          {
            title: 'Taşıyıcılarım',
            description: 'Taşıyıcı eklemek için buraya tıklayın',
            menuItem: 'Taşıyıcılarım',
            menuPath: '/nakliyeci/drivers',
            highlightType: 'menu',
            position: 'left'
          },
          {
            title: 'Tekliflerim',
            description: 'Verdiğiniz teklifleri buradan takip edin',
            menuItem: 'Tekliflerim',
            menuPath: '/nakliyeci/offers',
            highlightType: 'menu',
            position: 'left'
          },
          {
            title: 'Aktif Yükler',
            description: 'Aktif gönderilerinizi buradan takip edin',
            menuItem: 'Aktif Yükler',
            menuPath: '/nakliyeci/active-shipments',
            highlightType: 'menu',
            position: 'left'
          }
        ];

      case 'individual':
      case 'corporate':
        return [
          {
            title: 'Gönderi Oluştur',
            description: 'Bu butona tıklayarak yeni gönderi oluşturun',
            menuItem: 'Gönderi Oluştur',
            menuPath: role === 'individual' ? '/individual/create-shipment' : '/corporate/create-shipment',
            highlightType: 'menu',
            position: 'left'
          },
          {
            title: 'Gönderilerim',
            description: 'Oluşturduğunuz gönderileri buradan görün',
            menuItem: 'Gönderilerim',
            menuPath: role === 'individual' ? '/individual/my-shipments' : '/corporate/shipments',
            highlightType: 'menu',
            position: 'left'
          },
          {
            title: 'Teklifler',
            description: 'Gelen teklifleri buradan görüntüleyin',
            menuItem: 'Teklifler',
            menuPath: role === 'individual' ? '/individual/offers' : '/corporate/offers',
            highlightType: 'menu',
            position: 'left'
          },
          {
            title: 'Canlı Takip',
            description: 'Gönderilerinizi buradan takip edin',
            menuItem: 'Canlı Takip',
            menuPath: role === 'individual' ? '/individual/live-tracking' : '/corporate/shipments',
            highlightType: 'menu',
            position: 'left'
          }
        ];

      default:
        return [];
    }
  };

  const steps = getTutorialSteps();

  // Find and highlight menu item
  useEffect(() => {
    if (!isVisible || steps.length === 0) return;

    // On mobile, wait for menu to be open before highlighting
    if (isMobile && needsMenuOpen && currentStep > 0) {
      return;
    }

    const currentStepData = steps[currentStep];
    if (!currentStepData.menuItem) return;

    // Try to find the menu item in the sidebar
    const findMenuItem = () => {
      // Look for sidebar navigation - prioritize nav element
      const sidebar = document.querySelector('nav');

      if (!sidebar) {
        return null;
      }

      // First, try to find by exact href match (most reliable)
      if (currentStepData.menuPath) {
        // Try exact match first
        const linkByExactPath = sidebar.querySelector(`a[href="${currentStepData.menuPath}"]`);
        if (linkByExactPath) {
          return linkByExactPath as HTMLElement;
        }

        // Try partial match
        const linkByPartialPath = sidebar.querySelector(`a[href*="${currentStepData.menuPath}"]`);
        if (linkByPartialPath) {
          return linkByPartialPath as HTMLElement;
        }
      }

      // If href match fails, find by text content in span
      if (currentStepData.menuItem) {
        // Find all Link elements in nav
        const links = sidebar.querySelectorAll('a[href]');

        for (const link of Array.from(links)) {
          // Get the span element inside the link (menu item text)
          const span = link.querySelector('span.flex-1, span.truncate, span');
          if (span) {
            const text = span.textContent?.trim();
            // Exact match is best
            if (text === currentStepData.menuItem) {
              return link as HTMLElement;
            }
            // Partial match as fallback
            if (text && text.includes(currentStepData.menuItem)) {
              return link as HTMLElement;
            }
          }

          // Also check link's direct text content
          const linkText = link.textContent?.trim();
          if (linkText) {
            // Remove badge numbers and extra whitespace
            const cleanText = linkText.replace(/\d+/g, '').trim();
            if (cleanText === currentStepData.menuItem || cleanText.includes(currentStepData.menuItem)) {
              return link as HTMLElement;
            }
          }
        }
      }

      return null;
    };

    // Wait for DOM to be ready and retry if not found
    let retryCount = 0;
    const maxRetries = 10;

    const tryFind = () => {
      const element = findMenuItem();
      if (element) {
        setHighlightedElement(element);
      } else if (retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryFind, 200);
      }
    };

    const timer = setTimeout(tryFind, 100);
    return () => clearTimeout(timer);
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    // On mobile, if menu needs to be opened, open it first
    if (isMobile && needsMenuOpen && currentStep === 0) {
      const menuButton = document.querySelector('[data-testid="mobile-menu-button"]') as HTMLButtonElement;
      if (menuButton) {
        menuButton.click();
        setTimeout(() => {
          setNeedsMenuOpen(false);
          setCurrentStep(1);
        }, 500);
      } else {
        // Try alternative selector
        const menuButtonAlt = document.querySelector('button[aria-label*="Menüyü aç"], button[aria-label*="Toggle menu"]') as HTMLButtonElement;
        if (menuButtonAlt) {
          menuButtonAlt.click();
          setTimeout(() => {
            setNeedsMenuOpen(false);
            setCurrentStep(1);
          }, 500);
        }
      }
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (user?.id) {
      localStorage.setItem(`tutorial_seen_${user.id}`, 'true');
    }
    setIsVisible(false);
    setHighlightedElement(null);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible || steps.length === 0) {
    return null;
  }

  // Special step for mobile menu opening
  const isMenuOpeningStep = isMobile && needsMenuOpen && currentStep === 0;
  const currentStepData = isMenuOpeningStep ? {
    title: 'Menüyü Açın',
    description: 'Mobil cihazlarda menüyü görmek için sol üstteki menü butonuna tıklayın',
    highlightType: 'button' as const,
    position: 'bottom' as const,
  } : steps[currentStep];

  // Calculate highlight position
  const getHighlightStyle = () => {
    // For menu opening step, highlight the menu button
    if (isMenuOpeningStep) {
      const menuButton = document.querySelector('[data-testid="mobile-menu-button"]') as HTMLElement ||
        document.querySelector('button[aria-label*="Menüyü aç"], button[aria-label*="Toggle menu"]') as HTMLElement;
      if (menuButton) {
        const rect = menuButton.getBoundingClientRect();
        const padding = 4;
        return {
          element: {
            top: `${Math.max(0, rect.top - padding)}px`,
            left: `${Math.max(0, rect.left - padding)}px`,
            width: `${rect.width + (padding * 2)}px`,
            height: `${rect.height + (padding * 2)}px`,
          },
          spotlight: {
            centerX: `${rect.left + rect.width / 2}px`,
            centerY: `${rect.top + rect.height / 2}px`,
            radius: `${Math.max(rect.width, rect.height) * 1.8}px`,
          }
        };
      }
    }

    if (!highlightedElement) return null;
    const rect = highlightedElement.getBoundingClientRect();

    // Add small padding for better visibility
    const padding = 4;
    const top = Math.max(0, rect.top - padding);
    const left = Math.max(0, rect.left - padding);
    const width = rect.width + (padding * 2);
    const height = rect.height + (padding * 2);

    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const radius = Math.max(width, height) * 1.8;

    return {
      element: {
        top: `${top}px`,
        left: `${left}px`,
        width: `${width}px`,
        height: `${height}px`,
      },
      spotlight: {
        centerX: `${centerX}px`,
        centerY: `${centerY}px`,
        radius: `${radius}px`,
      }
    };
  };

  const highlightData = getHighlightStyle();
  const hasHighlight = (isMenuOpeningStep || highlightedElement) && highlightData;

  return (
    <>
      {/* Overlay with Spotlight Effect */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          background: hasHighlight
            ? `radial-gradient(circle at ${highlightData.spotlight.centerX} ${highlightData.spotlight.centerY}, transparent ${highlightData.spotlight.radius}, rgba(0, 0, 0, 0.9) ${highlightData.spotlight.radius})`
            : 'rgba(0, 0, 0, 0.85)',
        }}
      />

      {/* Highlighted Element Border */}
      {hasHighlight && (
        <div
          className="fixed z-[9999] pointer-events-none border-4 border-blue-500 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.8)] transition-all duration-300"
          style={{
            ...highlightData.element,
            borderRadius: '0.5rem',
          }}
        >
          {/* Pulse Animation */}
          <div className="absolute -inset-1 border-4 border-blue-400 rounded-lg animate-ping opacity-50"></div>
          <div className="absolute -inset-2 border-2 border-blue-300 rounded-lg animate-pulse opacity-30"></div>

          {/* Corner indicators for better visibility */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-4 border-l-4 border-blue-500 rounded-tl-lg"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-4 border-r-4 border-blue-500 rounded-tr-lg"></div>
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-4 border-l-4 border-blue-500 rounded-bl-lg"></div>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-4 border-r-4 border-blue-500 rounded-br-lg"></div>
        </div>
      )}

      {/* Arrow Indicator */}
      {hasHighlight && currentStepData.position && (
        <div
          className="fixed z-[10000] pointer-events-none"
          style={{
            ...(currentStepData.position === 'left' ? {
              right: `${window.innerWidth - parseFloat(highlightData.element.left.replace('px', '')) + 20}px`,
              top: `${parseFloat(highlightData.element.top.replace('px', '')) + parseFloat(highlightData.element.height.replace('px', '')) / 2}px`,
              transform: 'translateY(-50%)',
            } : currentStepData.position === 'right' ? {
              left: `${parseFloat(highlightData.element.left.replace('px', '')) + parseFloat(highlightData.element.width.replace('px', '')) + 20}px`,
              top: `${parseFloat(highlightData.element.top.replace('px', '')) + parseFloat(highlightData.element.height.replace('px', '')) / 2}px`,
              transform: 'translateY(-50%)',
            } : currentStepData.position === 'top' ? {
              left: `${parseFloat(highlightData.element.left.replace('px', '')) + parseFloat(highlightData.element.width.replace('px', '')) / 2}px`,
              bottom: `${window.innerHeight - parseFloat(highlightData.element.top.replace('px', '')) + 20}px`,
              transform: 'translateX(-50%)',
            } : {
              left: `${parseFloat(highlightData.element.left.replace('px', '')) + parseFloat(highlightData.element.width.replace('px', '')) / 2}px`,
              top: `${parseFloat(highlightData.element.top.replace('px', '')) + parseFloat(highlightData.element.height.replace('px', '')) + 20}px`,
              transform: 'translateX(-50%)',
            }),
            maxWidth: isMobile ? 'calc(100vw - 2rem)' : 'auto',
          }}
        >
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2 animate-bounce border-2 border-white/20 text-xs sm:text-sm">
            {currentStepData.position === 'left' && <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            {currentStepData.position === 'right' && <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
            {currentStepData.position === 'top' && <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />}
            {currentStepData.position === 'bottom' && <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />}
            <span className="font-bold whitespace-nowrap">{isMenuOpeningStep ? 'Menüyü açmak için tıklayın' : 'Buraya tıklayın'}</span>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="fixed bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-[10000] bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] md:w-full md:max-w-md mx-2 sm:mx-4 md:mx-0 p-3 sm:p-4 md:p-6 pointer-events-auto">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Kapat"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-blue-600'
                  : index < currentStep
                    ? 'w-2 bg-blue-300'
                    : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Step Content - Minimal Text */}
        <div className="text-center mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-1 sm:mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {currentStepData.description}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0 && !isMenuOpeningStep}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm ${
              (currentStep === 0 && !isMenuOpeningStep)
                ? 'text-slate-300 cursor-not-allowed'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Önceki</span>
          </button>
          <div className="text-xs sm:text-sm text-slate-500">
            {isMenuOpeningStep ? '0' : currentStep + 1} / {steps.length}
          </div>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium text-xs sm:text-sm"
          >
            {isMenuOpeningStep ? (
              <>
                <span>Menüyü Aç</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </>
            ) : currentStep === steps.length - 1 ? (
              <>
                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Tamamla</span>
                <span className="sm:hidden">Tamam</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Sonraki</span>
                <span className="sm:hidden">İleri</span>
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </div>

        {/* Skip Button */}
        <button
          onClick={handleSkip}
          className="w-full mt-2 sm:mt-3 text-xs text-slate-500 hover:text-slate-700 transition-colors py-1"
        >
          Şimdilik atla
        </button>
      </div>
    </>
  );
};

export default DashboardTutorial;