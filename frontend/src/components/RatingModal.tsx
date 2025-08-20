'use client';

import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useToast } from '@/hooks/useToast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalName: string;
  offerId: number;
  onRatingSubmitted: () => void;
}

export default function RatingModal({
  isOpen,
  onClose,
  professionalName,
  offerId,
  onRatingSubmitted
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError, showLoading, dismissLoading } = useToast();
  const { notifications } = useNotifications();

  const handleSubmit = async () => {
    if (rating === 0) {
      showError('Por favor selecciona una calificación');
      return;
    }

    if (review.trim().length < 10) {
      showError('La review debe tener al menos 10 caracteres');
      return;
    }

    setSubmitting(true);
    const loadingToast = showLoading('Enviando calificación...');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          offerId,
          rating,
          review: review.trim(),
          professionalName
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Review enviada exitosamente:', data);
        dismissLoading(loadingToast);
        showSuccess('¡Calificación enviada exitosamente! Gracias por tu feedback.', 5000);
        onRatingSubmitted();
        handleClose();
      } else {
        let errorMessage = 'Error al enviar la calificación';
        try {
          const errorData = await response.json();
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        dismissLoading(loadingToast);
        showError(errorMessage);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      dismissLoading(loadingToast);
      showError('Error al enviar la calificación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setReview('');
    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Calificar a {professionalName}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calificación *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                      }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {rating === 0 && 'Selecciona una calificación'}
              {rating === 1 && 'Muy malo'}
              {rating === 2 && 'Malo'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bueno'}
              {rating === 5 && 'Excelente'}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review *
            </label>
            <textarea
              value={review || ''}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia con este profesional..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-1">
              {review.length}/500 caracteres (mínimo 10)
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              disabled={submitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || rating === 0 || review.trim().length < 10}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </div>
              ) : (
                'Enviar Calificación'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 