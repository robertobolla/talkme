'use client';

import React from 'react';

export default function TestEnvPage() {
    const dailyApiKey = process.env.NEXT_PUBLIC_DAILY_API_KEY;

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold mb-4">Test Variables de Entorno</h1>

                <div className="bg-white p-4 rounded border">
                    <h2 className="font-semibold mb-2">DAILY_API_KEY:</h2>
                    <p className="text-sm bg-gray-100 p-2 rounded">
                        {dailyApiKey ?
                            `${dailyApiKey.substring(0, 10)}...${dailyApiKey.substring(dailyApiKey.length - 10)}` :
                            'No configurada'
                        }
                    </p>

                    <div className="mt-4">
                        <h2 className="font-semibold mb-2">Estado:</h2>
                        <p className={`text-sm p-2 rounded ${dailyApiKey ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {dailyApiKey ? '✅ Configurada correctamente' : '❌ No configurada'}
                        </p>
                    </div>
                </div>

                <div className="mt-4">
                    <a
                        href="/test-daily"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        Probar Daily Room
                    </a>
                </div>
            </div>
        </div>
    );
} 