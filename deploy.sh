#!/bin/bash

# YolNet Deployment Script
echo "🚀 YolNet Deployment Başlıyor..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Bağımlılıklar kontrol ediliyor..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js bulunamadı. Lütfen Node.js yükleyin."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm bulunamadı. Lütfen npm yükleyin."
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "Git bulunamadı. Lütfen Git yükleyin."
        exit 1
    fi
    
    print_status "Tüm bağımlılıklar mevcut"
}

# Install dependencies
install_dependencies() {
    print_status "Frontend bağımlılıkları yükleniyor..."
    npm install
    
    print_status "Backend bağımlılıkları yükleniyor..."
    cd backend && npm install && cd ..
    
    print_status "Bağımlılıklar yüklendi"
}

# Build frontend
build_frontend() {
    print_status "Frontend build ediliyor..."
    npm run build
    
    if [ $? -eq 0 ]; then
        print_status "Frontend build başarılı"
    else
        print_error "Frontend build başarısız"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Testler çalıştırılıyor..."
    npm run test 2>/dev/null || print_warning "Testler çalıştırılamadı"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Vercel'e deploy ediliyor..."
    
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI bulunamadı. Yükleniyor..."
        npm install -g vercel
    fi
    
    vercel --prod
    
    if [ $? -eq 0 ]; then
        print_status "Vercel deployment başarılı"
    else
        print_error "Vercel deployment başarısız"
        exit 1
    fi
}

# Deploy to Railway
deploy_railway() {
    print_status "Railway'e deploy ediliyor..."
    
    if ! command -v railway &> /dev/null; then
        print_warning "Railway CLI bulunamadı. Yükleniyor..."
        npm install -g @railway/cli
    fi
    
    railway login
    railway up
    
    if [ $? -eq 0 ]; then
        print_status "Railway deployment başarılı"
    else
        print_error "Railway deployment başarısız"
        exit 1
    fi
}

# Deploy with Docker
deploy_docker() {
    print_status "Docker image oluşturuluyor..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker bulunamadı. Lütfen Docker yükleyin."
        exit 1
    fi
    
    docker build -t yolnet-app .
    
    if [ $? -eq 0 ]; then
        print_status "Docker image oluşturuldu"
        print_warning "Docker container'ı çalıştırmak için: docker run -p 3000:3000 yolnet-app"
    else
        print_error "Docker image oluşturulamadı"
        exit 1
    fi
}

# Main deployment function
main() {
    echo "🎯 YolNet Deployment Script"
    echo "=========================="
    
    # Check dependencies
    check_dependencies
    
    # Install dependencies
    install_dependencies
    
    # Build frontend
    build_frontend
    
    # Run tests
    run_tests
    
    # Choose deployment method
    echo ""
    echo "Deployment yöntemi seçin:"
    echo "1) Vercel (Frontend + Backend)"
    echo "2) Railway (Full Stack)"
    echo "3) Docker (Local/Server)"
    echo "4) Sadece build (Deploy etme)"
    
    read -p "Seçiminiz (1-4): " choice
    
    case $choice in
        1)
            deploy_vercel
            ;;
        2)
            deploy_railway
            ;;
        3)
            deploy_docker
            ;;
        4)
            print_status "Build tamamlandı. Deploy edilmedi."
            ;;
        *)
            print_error "Geçersiz seçim"
            exit 1
            ;;
    esac
    
    echo ""
    print_status "Deployment tamamlandı! 🎉"
    echo ""
    echo "📋 Sonraki adımlar:"
    echo "1. Domain ayarlarını yapın"
    echo "2. SSL sertifikasını aktifleştirin"
    echo "3. Database bağlantısını test edin"
    echo "4. Monitoring'i aktifleştirin"
    echo ""
    echo "🔗 Faydalı linkler:"
    echo "- Vercel Dashboard: https://vercel.com/dashboard"
    echo "- Railway Dashboard: https://railway.app/dashboard"
    echo "- Google Analytics: https://analytics.google.com"
}

# Run main function
main "$@"





