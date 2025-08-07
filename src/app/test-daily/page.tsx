'use client';

import React, { useState } from 'react';

export default function TestDailyPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testDailyRoom = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/daily/room', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: '1',
          sessionName: 'Sesión de prueba',
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Daily.co</h1>
        
        <button
          onClick={testDailyRoom}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Probando...' : 'Probar Daily Room'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-white rounded border">
            <h2 className="font-semibold mb-2">Resultado:</h2>
            <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 