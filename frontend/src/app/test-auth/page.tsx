'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

export default function TestAuthPage() {
  const { isLoaded, user } = useUser();
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testClerkUser = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-clerk-user');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Error testing Clerk user:', error);
      setDebugData({ error: 'Error al probar usuario' });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test de Autenticación</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Información de Clerk:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Usuario cargado:</strong> {isLoaded ? 'Sí' : 'No'}</p>
          <p><strong>Usuario autenticado:</strong> {user ? 'Sí' : 'No'}</p>
          {user && (
            <>
              <p><strong>ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}</p>
              <p><strong>Nombre:</strong> {user.fullName}</p>
            </>
          )}
        </div>
      </div>

      <button
        onClick={testClerkUser}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Probando...' : 'Probar Usuario en Strapi'}
      </button>

      {debugData && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Resultado del Debug:</h2>
          <div className="bg-gray-100 p-4 rounded">
            <pre className="whitespace-pre-wrap text-sm">
              {JSON.stringify(debugData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 