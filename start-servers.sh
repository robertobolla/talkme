#!/bin/bash

echo "🚀 Iniciando servidores..."

# Iniciar backend en background
echo "📡 Iniciando Backend (Strapi)..."
cd backend && npm run develop &
BACKEND_PID=$!

# Esperar un poco
sleep 10

# Iniciar frontend en background
echo "🌐 Iniciando Frontend (Next.js)..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Servidores iniciados"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "🌐 Frontend: http://localhost:3001"
echo "📡 Backend: http://localhost:1337"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores"

# Esperar a que se presione Ctrl+C
trap "echo '🛑 Deteniendo servidores...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 