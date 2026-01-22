#!/bin/bash
# Cursor Performance Optimization Script for Linux/Mac

echo "🚀 Cursor Performans Optimizasyonu Başlatılıyor..."
echo ""

# 1. Clear Cursor cache
echo "1️⃣ Cursor cache temizleniyor..."
CURSOR_CACHE="$HOME/.config/Cursor/Cache"
if [ -d "$CURSOR_CACHE" ]; then
    rm -rf "$CURSOR_CACHE"/*
    echo "   ✅ Cache temizlendi: $CURSOR_CACHE"
else
    echo "   ⚠️ Cache klasörü bulunamadı"
fi

# 2. Clear Cursor logs (keep last 3 days)
echo "2️⃣ Eski log dosyaları temizleniyor..."
CURSOR_LOGS="$HOME/.config/Cursor/logs"
if [ -d "$CURSOR_LOGS" ]; then
    find "$CURSOR_LOGS" -type f -mtime +3 -delete 2>/dev/null
    echo "   ✅ 3 günden eski loglar temizlendi"
else
    echo "   ⚠️ Log klasörü bulunamadı"
fi

# 3. Clear npm cache
echo "3️⃣ NPM cache temizleniyor..."
if command -v npm &> /dev/null; then
    npm cache clean --force 2>/dev/null
    echo "   ✅ NPM cache temizlendi"
else
    echo "   ⚠️ NPM bulunamadı"
fi

# 4. Clear Vite cache
echo "4️⃣ Vite cache temizleniyor..."
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite/*
    echo "   ✅ Vite cache temizlendi"
else
    echo "   ⚠️ Vite cache klasörü bulunamadı"
fi

# 5. Check system resources
echo "5️⃣ Sistem kaynakları kontrol ediliyor..."
if command -v free &> /dev/null; then
    MEM_INFO=$(free -h | grep Mem)
    echo "   RAM Bilgisi: $MEM_INFO"
fi

if command -v top &> /dev/null; then
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    echo "   CPU Kullanımı: ${CPU_USAGE}%"
fi

# 6. Check disk space
echo "6️⃣ Disk alanı kontrol ediliyor..."
if command -v df &> /dev/null; then
    DISK_INFO=$(df -h . | tail -1)
    echo "   Disk Bilgisi: $DISK_INFO"
fi

echo ""
echo "📋 ÖNERİLER:"
echo "   1. Cursor'ı yeniden başlatın"
echo "   2. Kullanmadığınız extension'ları kapatın"
echo "   3. Büyük dosyaları açmak yerine arama yapın"
echo "   4. Cloud sync servislerini duraklatın (proje klasörü için)"
echo ""
echo "✅ Optimizasyon tamamlandı!"
echo ""
echo "Detaylı bilgi için CURSOR_PERFORMANCE_GUIDE.md dosyasını okuyun."



















