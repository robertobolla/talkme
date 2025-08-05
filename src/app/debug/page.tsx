'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DebugPage() {
    const [systemInfo, setSystemInfo] = useState({
        nodeEnv: '',
        strapiUrl: '',
        clerkKey: '',
        timestamp: ''
    });

    useEffect(() => {
        setSystemInfo({
            nodeEnv: process.env.NODE_ENV || 'development',
            strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
            clerkKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Configurado' : 'No configurado',
            timestamp: new Date().toISOString()
        });
    }, []);

    const testBackend = async () => {
            try {
      const response = await fetch('http://localhost:1337/api/onboarding/system-status');
            return response.ok ? 'Conectado' : 'Error';
        } catch (error) {
            return 'Error de conexión';
        }
    };

    const [backendStatus, setBackendStatus] = useState('Pendiente');

    useEffect(() => {
        testBackend().then(setBackendStatus);
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug del Sistema</h1>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Información del Sistema</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p><strong>NODE_ENV:</strong> {systemInfo.nodeEnv}</p>
                            <p><strong>STRAPI_URL:</strong> {systemInfo.strapiUrl}</p>
                            <p><strong>CLERK_KEY:</strong> {systemInfo.clerkKey}</p>
                            <p><strong>Timestamp:</strong> {systemInfo.timestamp}</p>
                        </div>
                        <div>
                            <p><strong>Backend Status:</strong> {backendStatus}</p>
                            <p><strong>Frontend Port:</strong> 3000</p>
                            <p><strong>Backend Port:</strong> 1337</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Pruebas Rápidas</h2>
                    <div className="space-y-4">
                        <button
                            onClick={() => window.open('http://localhost:1337', '_blank')}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Probar Backend Strapi
                        </button>
                                                 <button
                             onClick={() => window.open('http://localhost:3000', '_blank')}
                             className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-2"
                         >
                            Probar Frontend
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-semibold mb-4">Enlaces de Prueba</h2>
                    <div className="space-y-2">
                        <Link href="/" className="block text-blue-600 hover:underline">Página Principal</Link>
                        <Link href="/onboarding" className="block text-blue-600 hover:underline">Onboarding</Link>
                        <Link href="/dashboard" className="block text-blue-600 hover:underline">Dashboard</Link>
                        <Link href="/test-onboarding" className="block text-blue-600 hover:underline">Test Onboarding</Link>
                    </div>
                </div>
            </div>
        </div>
    );
} 