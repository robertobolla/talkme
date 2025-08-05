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
      console.log('Home: Usuario autenticado:', user.id);
      console.log('Home: Email del usuario:', user.emailAddresses?.[0]?.emailAddress);

      // Verificar si el usuario tiene un perfil
      const checkProfile = async () => {
        try {
          console.log('Home: Verificando perfil...');
          const response = await fetch('/api/onboarding/profile-form');
          console.log('Home: Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('Home: Datos del perfil recibidos:', data);

            if (data.data && data.data.role) {
              console.log('Home: Usuario tiene perfil, redirigiendo al dashboard');
              router.push('/dashboard');
            } else {
              console.log('Home: Usuario no tiene perfil, redirigiendo al onboarding');
              router.push('/onboarding');
            }
          } else {
            console.log('Home: Error en la respuesta, redirigiendo al onboarding');
            router.push('/onboarding');
          }
        } catch (error) {
          console.error('Error checking profile:', error);
          router.push('/onboarding');
        }
      };

      checkProfile();
    } else {
      console.log('Home: Usuario no autenticado');
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
      <section className="bg-gradient-to-br from-pink-600 to-purple-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              TalkMe
              <br />
              <span className="text-pink-200">Acompañamiento Virtual</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-pink-100">
              Conecta con acompañantes virtuales para conversaciones significativas y apoyo emocional
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/sign-up')}
                className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors"
              >
                Registrarse
              </button>
              <button
                onClick={() => router.push('/sign-in')}
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-pink-600 transition-colors"
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
              ¿Por qué elegir TalkMe?
            </h2>
            <p className="text-xl text-gray-600">
              Plataforma de acompañamiento virtual con profesionales especializados
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Acompañamiento Emocional</h3>
              <p className="text-gray-600">
                Acompañantes especializados en apoyo emocional y conversaciones significativas
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Compañía Virtual</h3>
              <p className="text-gray-600">
                Sesiones de video y chat con acompañantes disponibles 24/7
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Seguridad y Privacidad</h3>
              <p className="text-gray-600">
                Plataforma segura con pagos en criptomonedas y protección de datos
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Calificación y Reseñas</h3>
              <p className="text-gray-600">
                Sistema de calificaciones para garantizar la calidad del servicio
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Acompañantes Verificados</h3>
              <p className="text-gray-600">
                Todos nuestros acompañantes pasan por un proceso de verificación
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Sesiones Programadas</h3>
              <p className="text-gray-600">
                Reserva sesiones con anticipación y gestiona tu tiempo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-pink-600 to-purple-700 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl mb-8">
            Únete a TalkMe y encuentra el acompañamiento que necesitas
          </p>
          <button
            onClick={() => router.push('/sign-up')}
            className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-pink-50 transition-colors"
          >
            Comenzar Ahora
          </button>
        </div>
      </section>

      <TestNavigation />
    </div>
  );
}
