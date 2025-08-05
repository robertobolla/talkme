'use client';

import { useState, useEffect } from 'react';

export default function SimpleTestPage() {
  const [status, setStatus] = useState('Cargando...');
  const [backendStatus, setBackendStatus] = useState('Pendiente');
  const [frontendStatus, setFrontendStatus] = useState('Pendiente');

  useEffect(() => {
    setStatus('Página cargada correctamente');

    // Test frontend status
    fetch('/api/status')
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Error en health check');
        }
      })
      .then(data => {
        setFrontendStatus('✅ Funcionando');

        // Test backend connection
        return fetch('http://localhost:1337/api/onboarding/public-status');
      })
      .then(backendResponse => {
        if (backendResponse.ok) {
          setBackendStatus('✅ Conectado');
        } else {
          setBackendStatus('❌ Error: ' + backendResponse.status);
        }
      })
      .catch(error => {
        setBackendStatus('❌ Error de conexión: ' + error.message);
        setFrontendStatus('❌ Error: ' + error.message);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Simple</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado del Sistema</h2>
          <div className="space-y-4">
            <div>
              <p><strong>Página:</strong> {status}</p>
            </div>
            <div>
              <p><strong>Backend (Strapi):</strong> {backendStatus}</p>
            </div>
            <div>
              <p><strong>Frontend API:</strong> {frontendStatus}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Información del Sistema</h2>
          <div className="space-y-2 text-sm">
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
            <p><strong>STRAPI_URL:</strong> {process.env.STRAPI_URL || 'http://localhost:1337'}</p>
            <p><strong>CLERK_KEY:</strong> {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Configurado' : 'No configurado'}</p>
            <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 