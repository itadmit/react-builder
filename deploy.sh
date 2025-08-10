#!/bin/bash

# Deploy script for QuickShop Builder
# הסקריפט עולה את קבצי ה-build לשרת EC2

set -e  # Exit on any error

echo "🚀 מתחיל תהליך Deploy..."

# בדיקה שה-build directory קיים
if [ ! -d "dist" ]; then
    echo "❌ אין תיקית dist - יש להריץ npm run build קודם"
    exit 1
fi

# בדיקה שקבצי ה-build קיימים
if [ ! -f "dist/builder.js" ] || [ ! -f "dist/preview.js" ]; then
    echo "❌ קבצי ה-build לא נמצאו - יש להריץ npm run build קודם"
    exit 1
fi

echo "📦 קבצי ה-build נמצאו, מעלה לשרת..."

# העלאת קבצי ה-dist לשרת EC2
scp -r dist/* quickshop:/var/www/html/assets/react-builder/

if [ $? -eq 0 ]; then
    echo "✅ Deploy הושלם בהצלחה!"
    echo "📁 הקבצים הועלו ל: /var/www/html/assets/react-builder"
else
    echo "❌ שגיאה בהעלאת הקבצים"
    exit 1
fi