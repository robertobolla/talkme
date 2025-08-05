'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TestNavigation() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testStrapiConnection = async () => {
    try {
      addResult('Probando conexión con Strapi...');
      const response = await fetch('/api/status');
      const data = await response.json();

      if (data.services?.strapi === 'connected') {
        addResult('✅ Strapi conectado correctamente');
      } else {
        addResult('❌ Strapi no está conectado');
      }
    } catch (error) {
      addResult(`❌ Error conectando con Strapi: ${error}`);
    }
  };

  const testProfileCheck = async () => {
    try {
      addResult('Probando verificación de perfil...');
      const response = await fetch('/api/onboarding/profile-form');
      const data = await response.json();
      addResult(`Perfil: ${JSON.stringify(data)}`);
    } catch (error) {
      addResult(`❌ Error verificando perfil: ${error}`);
    }
  };

  const testClearData = async () => {
    try {
      addResult('Limpiando datos de perfil...');
      const response = await fetch('/api/onboarding/update-profile', {
        method: 'DELETE'
      });
      const data = await response.json();
      addResult(`Datos limpiados: ${JSON.stringify(data)}`);
    } catch (error) {
      addResult(`❌ Error limpiando datos: ${error}`);
    }
  };

  const testCreateSampleOffers = async () => {
    try {
      addResult('Creando ofertas de ejemplo...');
      const sampleOffers = [
        {
          title: 'Cuidado de ancianos en casa',
          description: 'Necesito ayuda para cuidar a mi madre de 85 años',
          location: 'Buenos Aires, Argentina',
          dateTime: '2024-01-15T10:00:00.000Z',
          duration: 4,
          hourlyRate: 25,
          specialRequirements: 'Experiencia con demencia',

        },
        {
          title: 'Acompañamiento médico',
          description: 'Busco profesional para acompañar a citas médicas',
          location: 'Córdoba, Argentina',
          dateTime: '2024-01-20T14:00:00.000Z',
          duration: 2,
          hourlyRate: 30,
          specialRequirements: 'Conocimientos básicos de medicina',

        }
      ];

      for (const offer of sampleOffers) {
        const response = await fetch('/api/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(offer)
        });
        const data = await response.json();
        addResult(`Oferta creada: ${data.success ? '✅' : '❌'}`);
      }
    } catch (error) {
      addResult(`❌ Error creando ofertas: ${error}`);
    }
  };

  const testClearOffers = async () => {
    try {
      addResult('Limpiando ofertas...');
      const response = await fetch('/api/offers', {
        method: 'DELETE'
      });
      const data = await response.json();
      addResult(`Ofertas limpiadas: ${JSON.stringify(data)}`);
    } catch (error) {
      addResult(`❌ Error limpiando ofertas: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold mb-4">🔧 Panel de Pruebas</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <button
          onClick={testStrapiConnection}
          className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
        >
          Test Strapi
        </button>

        <button
          onClick={testProfileCheck}
          className="bg-green-500 text-white px-3 py-2 rounded text-sm hover:bg-green-600"
        >
          Test Profile
        </button>

        <button
          onClick={testClearData}
          className="bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
        >
          Clear Data
        </button>

        <button
          onClick={testCreateSampleOffers}
          className="bg-purple-500 text-white px-3 py-2 rounded text-sm hover:bg-purple-600"
        >
          Create Offers
        </button>

        <button
          onClick={testClearOffers}
          className="bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600"
        >
          Clear Offers
        </button>

        <button
          onClick={clearResults}
          className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>

      <div className="space-y-2">
        <Link href="/onboarding" className="text-blue-600 hover:underline">
          → Onboarding
        </Link>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          → Dashboard
        </Link>
        <Link href="/admin/clear-data" className="text-blue-600 hover:underline">
          → Admin Panel
        </Link>
      </div>

      {testResults.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Resultados de Pruebas:</h4>
          <div className="bg-white p-3 rounded border max-h-40 overflow-y-auto text-sm">
            {testResults.map((result, index) => (
              <div key={index} className="mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 