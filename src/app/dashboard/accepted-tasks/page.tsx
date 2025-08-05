'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface AcceptedTask {
  id: number;
  title: string;
  description: string;
  location: string;
  dateTime: string;
  duration: number;
  hourlyRate: number;
  specialRequirements?: string;

  client: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  status: string;
}

export default function AcceptedTasksPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [acceptedTasks, setAcceptedTasks] = useState<AcceptedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotifications();

  useEffect(() => {
    if (!isLoaded) return;

    const fetchAcceptedTasks = async () => {
      try {
        const response = await fetch('/api/offers/accepted-tasks');
        if (response.ok) {
          const data = await response.json();
          setAcceptedTasks(data.tasks || []);
        } else {
          showError('Error al cargar las tareas aceptadas');
        }
      } catch (error) {
        console.error('Error fetching accepted tasks:', error);
        showError('Error al cargar las tareas aceptadas');
      } finally {
        setLoading(false);
      }
    };

    fetchAcceptedTasks();
  }, [isLoaded, showError]);

  if (!isLoaded || loading) {
    return (
      <div className="pt-16 min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando tareas aceptadas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Tareas Aceptadas</h1>
          <p className="text-gray-600">Aquí puedes ver los detalles de las tareas que has sido aceptado para realizar</p>
        </div>

        {acceptedTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes tareas aceptadas</h3>
            <p className="text-gray-600">Cuando un cliente te acepte para una tarea, aparecerá aquí con todos los detalles.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {acceptedTasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow-md p-6">
                {/* Task Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{task.title}</h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(task.dateTime).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(task.dateTime).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {task.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">

                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      Aceptado
                    </span>
                  </div>
                </div>

                {/* Task Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Detalles de la Tarea</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Descripción</p>
                        <p className="text-gray-900">{task.description}</p>
                      </div>
                      {task.specialRequirements && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Requerimientos Especiales</p>
                          <p className="text-gray-900">{task.specialRequirements}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Duración</p>
                          <p className="text-gray-900">{task.duration} horas</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Tarifa</p>
                          <p className="text-gray-900">${task.hourlyRate}/hora</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Cliente</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{task.client.fullName}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-900">{task.client.email}</span>
                      </div>
                      {task.client.phone && (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-900">{task.client.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                {task.client.emergencyContact && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                      Contacto de Emergencia
                    </h3>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Nombre</p>
                          <p className="text-gray-900">{task.client.emergencyContact.name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Teléfono</p>
                          <p className="text-gray-900">{task.client.emergencyContact.phone}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Relación</p>
                          <p className="text-gray-900">{task.client.emergencyContact.relationship}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 