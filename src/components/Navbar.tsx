'use client';

import { useUser, SignOutButton, SignInButton, SignUpButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Home, Briefcase, Settings } from 'lucide-react';

interface UserProfile {
  role: 'client' | 'professional';
  fullName: string;
}

export default function Navbar() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/onboarding/profile-form');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [isLoaded, user]);

  if (!isLoaded) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSignOut = () => {
    setIsMenuOpen(false);
    router.push('/');
  };

  const isClient = userProfile?.role === 'client';
  const isProfessional = userProfile?.role === 'professional';

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">EC</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">ElderCare</span>
            </Link>
          </div>

          {/* Navegación desktop */}
          <div className="hidden md:flex items-center space-x-8">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/edit-profile"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Mi Perfil
                </Link>
                <Link
                  href="/dashboard/create-offer"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Crear Oferta
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/#features"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Características
                </Link>
                <Link
                  href="/#about"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Acerca de
                </Link>
                <Link
                  href="/#contact"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Contacto
                </Link>
              </>
            )}
          </div>

          {/* Usuario y logout desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-sm text-gray-700">
                    {user.firstName || user.emailAddresses?.[0]?.emailAddress}
                  </span>
                </div>
                <SignOutButton>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </SignOutButton>
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Iniciar Sesión
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                    Registrarse
                  </button>
                </SignUpButton>
              </>
            )}
          </div>

          {/* Botón móvil */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-md"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/edit-profile"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Mi Perfil</span>
                  </Link>
                  <Link
                    href="/dashboard/create-offer"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Crear Oferta</span>
                  </Link>
                  <div className="border-t pt-2">
                    <div className="flex items-center space-x-2 px-3 py-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        {user.firstName || user.emailAddresses?.[0]?.emailAddress}
                      </span>
                    </div>
                    <SignOutButton>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 text-gray-700 hover:text-red-600 w-full px-3 py-2 rounded-md text-base font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </SignOutButton>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/#features"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Características</span>
                  </Link>
                  <Link
                    href="/#about"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Acerca de</span>
                  </Link>
                  <Link
                    href="/#contact"
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Contacto</span>
                  </Link>
                  <div className="border-t pt-2 space-y-2">
                    <SignInButton mode="modal">
                      <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 w-full px-3 py-2 rounded-md text-base font-medium">
                        <span>Iniciar Sesión</span>
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button className="flex items-center space-x-2 bg-blue-600 text-white w-full px-3 py-2 rounded-md text-base font-medium hover:bg-blue-700">
                        <span>Registrarse</span>
                      </button>
                    </SignUpButton>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 