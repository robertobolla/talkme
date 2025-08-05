'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, ArrowLeft, MessageSquare, Calendar } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

interface Review {
    id: number;
    rating: number;
    comment: string;
    date: string;
    isAnonymous: boolean;
    client?: {
        id: number;
        fullName: string;
    };
    offer?: {
        id: number;
        title: string;
    };
}

interface UserProfile {
    id: number;
    fullName: string;
    averageRating: number;
    reviewsReceived: Review[];
}

export default function ReviewsPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();
    const professionalId = searchParams.get('professionalId');

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isViewingOtherProfessional, setIsViewingOtherProfessional] = useState(false);

    useEffect(() => {
        if (!isLoaded || !user) return;

        const fetchProfile = async () => {
            try {
                if (professionalId) {
                    // Si hay un professionalId, obtener el perfil de ese profesional
                    const response = await fetch(`/api/user-profiles/${professionalId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setUserProfile(data.data);
                        setIsViewingOtherProfessional(true);
                    }
                } else {
                    // Obtener el perfil del usuario actual
                    const response = await fetch('/api/onboarding/profile-form');
                    if (response.ok) {
                        const data = await response.json();
                        setUserProfile(data.data);
                        setIsViewingOtherProfessional(false);
                    }
                }
            } catch (error) {
                console.error('Error fetching profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [isLoaded, user, professionalId]);

    if (!isLoaded || loading) {
        return (
            <div className="pt-16 min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <div className="pt-16 min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <EmptyState
                        icon={Star}
                        title="Perfil no encontrado"
                        description="No se pudo cargar el perfil del profesional"
                    />
                </div>
            </div>
        );
    }

    // Si no estamos viendo otro profesional, verificar que el usuario actual sea profesional
    if (!isViewingOtherProfessional && userProfile.role !== 'professional') {
        return (
            <div className="pt-16 min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <EmptyState
                        icon={Star}
                        title="Acceso no autorizado"
                        description="Esta página es solo para profesionales"
                    />
                </div>
            </div>
        );
    }

    const reviews = userProfile.reviewsReceived || [];

    return (
        <div className="pt-16 min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">
                                    {isViewingOtherProfessional
                                        ? `Calificaciones de ${userProfile.fullName}`
                                        : 'Mis Calificaciones y Reviews'
                                    }
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    {isViewingOtherProfessional
                                        ? `Historial completo de calificaciones recibidas por ${userProfile.fullName}`
                                        : 'Historial completo de calificaciones recibidas'
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="text-center">
                                <div className="flex items-center justify-center space-x-1">
                                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                                    <span className="text-2xl font-bold text-gray-900">
                                        {userProfile.averageRating.toFixed(1)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Promedio de {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews List */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Todas las Reviews ({reviews.length})
                        </h2>
                    </div>

                    <div className="p-6">
                        {reviews.length === 0 ? (
                            <EmptyState
                                icon={MessageSquare}
                                title={isViewingOtherProfessional ? "No hay reviews aún" : "No tienes reviews aún"}
                                description={isViewingOtherProfessional
                                    ? "Este profesional aún no ha recibido calificaciones de sus clientes"
                                    : "Las calificaciones de tus clientes aparecerán aquí una vez que completes trabajos"
                                }
                            />
                        ) : (
                            <div className="space-y-6">
                                {reviews.map((review) => (
                                    <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <div className="flex items-center space-x-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`w-5 h-5 ${i < review.rating
                                                                    ? 'text-yellow-500 fill-current'
                                                                    : 'text-gray-300'
                                                                    }`}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm text-gray-600">
                                                        {review.rating}/5
                                                    </span>
                                                </div>

                                                {review.comment && (
                                                    <div className="mb-4">
                                                        <div className="flex items-start space-x-2">
                                                            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <p className="text-gray-700">{review.comment}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="w-4 h-4" />
                                                        <span>
                                                            {new Date(review.date).toLocaleDateString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                    {review.offer && (
                                                        <span className="text-blue-600">
                                                            Trabajo: {review.offer.title}
                                                        </span>
                                                    )}
                                                    {review.isAnonymous && (
                                                        <span className="text-gray-400 italic">
                                                            Cliente anónimo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 