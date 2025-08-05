import React from 'react';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: 'published' | 'accepted' | 'cancelled' | 'completed';
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    published: {
      icon: Clock,
      text: 'Publicada',
      classes: 'bg-green-100 text-green-800 border-green-200',
      iconClasses: 'text-green-600'
    },
    accepted: {
      icon: CheckCircle,
      text: 'Aceptada',
      classes: 'bg-blue-100 text-blue-800 border-blue-200',
      iconClasses: 'text-blue-600'
    },
    cancelled: {
      icon: XCircle,
      text: 'Cancelada',
      classes: 'bg-red-100 text-red-800 border-red-200',
      iconClasses: 'text-red-600'
    },
    completed: {
      icon: CheckCircle,
      text: 'Completada',
      classes: 'bg-purple-100 text-purple-800 border-purple-200',
      iconClasses: 'text-purple-600'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.classes} ${className}`}>
      <Icon className={`w-3 h-3 mr-1 ${config.iconClasses}`} />
      {config.text}
    </span>
  );
} 