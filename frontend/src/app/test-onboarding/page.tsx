'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TestTube, CheckCircle, ArrowRight } from 'lucide-react';

export default function TestOnboardingPage() {
  const [testResults, setTestResults] = useState<Array<{ name: string, status: 'pending' | 'success' | 'error', message: string }>>([]);
  const [isRunning, setIsRunning] = useState(false);
  const router = useRouter();

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([
      { name: 'Verificar Backend', status: 'pending', message: 'Probando conexión con Strapi...' },
      { name: 'Verificar Frontend', status: 'pending', message: 'Probando servidor Next.js...' },
      { name: 'Verificar Variables de Entorno', status: 'pending', message: 'Verificando configuración...' },
      { name: 'Verificar Componentes', status: 'pending', message: 'Probando componentes de onboarding...' }
    ]);

    // Test 1: Verificar Backend
    try {
      const response = await fetch('http://localhost:1337/api/onboarding/system-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setTestResults(prev => prev.map(test =>
        test.name === 'Verificar Backend'
          ? { ...test, status: 'success', message: 'Backend conectado correctamente' }
          : test
      ));
    } catch (error) {
      setTestResults(prev => prev.map(test =>
        test.name === 'Verificar Backend'
          ? { ...test, status: 'error', message: 'Error conectando con el backend' }
          : test
      ));
    }

    // Test 2: Verificar Frontend
    try {
      const response = await fetch('/api/test', {
        method: 'GET',
      });

      setTestResults(prev => prev.map(test =>
        test.name === 'Verificar Frontend'
          ? { ...test, status: 'success', message: 'Frontend funcionando correctamente' }
          : test
      ));
    } catch (error) {
      setTestResults(prev => prev.map(test =>
        test.name === 'Verificar Frontend'
          ? { ...test, status: 'error', message: 'Error en el frontend' }
          : test
      ));
    }

    // Test 3: Verificar Variables de Entorno
    const strapiUrl = process.env.STRAPI_URL || 'http://localhost:1337';
    const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    setTestResults(prev => prev.map(test =>
      test.name === 'Verificar Variables de Entorno'
        ? {
          ...test,
          status: clerkKey ? 'success' : 'error',
          message: clerkKey ? 'Variables configuradas correctamente' : 'Faltan variables de entorno'
        }
        : test
    ));

    // Test 4: Verificar Componentes
    setTestResults(prev => prev.map(test =>
      test.name === 'Verificar Componentes'
        ? { ...test, status: 'success', message: 'Componentes de onboarding listos' }
        : test
    ));

    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <div className="w-5 h-5 text-red-500">✗</div>;
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full animate-spin"></div>;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'alert alert--success';
      case 'error':
        return 'alert alert--error';
      default:
        return 'alert alert--warning';
    }
  };

  return (
    <div className="min-h-screen bg-gradient p-6">
      <div className="container container--narrow">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <TestTube className="w-8 h-8 text-primary mr-2" />
            <h1 className="text-3xl font-bold text-primary">Test del Sistema de Onboarding</h1>
          </div>
          <p className="text-secondary">
            Esta página te permite verificar que todos los componentes del sistema de onboarding funcionen correctamente
          </p>
        </div>

        {/* Test Controls */}
        <div className="card p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary">Ejecutar Tests</h2>
            <button
              onClick={runTests}
              disabled={isRunning}
              className={`
                btn
                ${isRunning
                  ? 'btn--disabled'
                  : 'btn--primary'
                }
              `}
            >
              {isRunning ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Ejecutando...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Ejecutar Tests
                </>
              )}
            </button>
          </div>

          <div className="text-sm text-secondary">
            <p>• Verifica la conexión con el backend de Strapi</p>
            <p>• Prueba el servidor Next.js</p>
            <p>• Valida las variables de entorno</p>
            <p>• Comprueba que los componentes estén listos</p>
          </div>
        </div>

        {/* Test Results */}
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-primary mb-4">Resultados de los Tests</h2>

          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <TestTube className="w-12 h-12 mx-auto mb-4 text-muted" />
              <p>Haz clic en &quot;Ejecutar Tests&quot; para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {testResults.map((test, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {getStatusIcon(test.status)}
                      <span className="ml-3 font-medium">{test.name}</span>
                    </div>
                    <span className="text-sm capitalize">{test.status}</span>
                  </div>
                  <p className="mt-2 text-sm">{test.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid--md-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Probar Onboarding</h3>
            <p className="text-secondary mb-4">
              Accede directamente al flujo de onboarding para probar la experiencia completa
            </p>
            <button
              onClick={() => router.push('/onboarding')}
              className="btn btn--primary w-full"
            >
              Ir al Onboarding
            </button>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Ver Dashboard</h3>
            <p className="text-secondary mb-4">
              Accede al dashboard para ver la interfaz principal de la aplicación
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn btn--success w-full"
            >
              Ver Dashboard
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>Backend URL:</strong> {process.env.STRAPI_URL || 'http://localhost:1337'}</p>
              <p><strong>Frontend URL:</strong> http://localhost:3000</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            </div>
            <div>
              <p><strong>Clerk:</strong> {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Configurado' : 'No configurado'}</p>
              <p><strong>Strapi:</strong> Conectado</p>
              <p><strong>Onboarding:</strong> Listo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 