'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Heart, Users, Shield, Star, UserCheck, Clock } from 'lucide-react';
import TestNavigation from '@/components/TestNavigation';

export default function Home() {
  const { isLoaded, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      // Verificar si el usuario tiene un perfil
      const checkProfile = async () => {
        try {
          const response = await fetch('/api/onboarding/profile-form');
          if (response.ok) {
            const data = await response.json();
            if (data.role) {
              router.push('/dashboard');
            } else {
              router.push('/onboarding');
            }
          } else {
            router.push('/onboarding');
          }
        } catch (error) {
          console.error('Error checking profile:', error);
          router.push('/onboarding');
        }
      };

      checkProfile();
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Cuidado de Ancianos
              <br />
              <span className="text-blue-200">Profesional y Confiable</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Conectamos familias con profesionales especializados en el cuidado de ancianos
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/sign-up')}
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Registrarse
              </button>
              <button
                onClick={() => router.push('/sign-in')}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir ElderCare?
            </h2>
            <p className="text-xl text-gray-600">
              Ofrecemos la mejor plataforma para conectar familias con profesionales del cuidado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cuidado Personalizado</h3>
              <p className="text-gray-600">
                Cada profesional está especializado en diferentes tipos de cuidado y necesidades específicas
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Profesionales Verificados</h3>
              <p className="text-gray-600">
                Todos nuestros profesionales pasan por un riguroso proceso de verificación y certificación
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Disponibilidad 24/7</h3>
              <p className="text-gray-600">
                Encuentra profesionales disponibles en cualquier momento del día o la noche
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Calificación y Reseñas</h3>
              <p className="text-gray-600">
                Sistema de calificaciones y reseñas para ayudarte a elegir el mejor profesional
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Perfiles Detallados</h3>
              <p className="text-gray-600">
                Conoce la experiencia, habilidades y especialidades de cada profesional
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Comunidad Confiable</h3>
              <p className="text-gray-600">
                Únete a una comunidad de familias y profesionales comprometidos con el cuidado
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Únete a nuestra plataforma y encuentra el cuidado profesional que tu familia merece
          </p>
          <button
            onClick={() => router.push('/sign-up')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Registrarse Gratis
          </button>
        </div>
      </section>

      {/* Test Navigation (solo para desarrollo) */}
      <TestNavigation />
    </div>
  );
}
