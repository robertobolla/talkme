export function canCompleteTask(dateTime: string, duration: number): boolean {
  const taskStartTime = new Date(dateTime);
  const taskEndTime = new Date(taskStartTime.getTime() + duration * 60 * 60 * 1000); // Convertir horas a milisegundos
  const currentTime = new Date();

  return currentTime >= taskEndTime;
}

export function getTaskEndTime(dateTime: string, duration: number): Date {
  const taskStartTime = new Date(dateTime);
  return new Date(taskStartTime.getTime() + duration * 60 * 60 * 1000);
}

export function formatTaskTime(dateTime: string, duration: number): string {
  const startTime = new Date(dateTime);
  const endTime = getTaskEndTime(dateTime, duration);

  const startFormatted = startTime.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const endFormatted = endTime.toLocaleString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${startFormatted} - ${endFormatted}`;
}

export function getTimeUntilCompletion(dateTime: string, duration: number): string {
  const endTime = getTaskEndTime(dateTime, duration);
  const currentTime = new Date();
  const timeDiff = endTime.getTime() - currentTime.getTime();

  if (timeDiff <= 0) {
    return 'Completada';
  }

  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m restantes`;
  } else {
    return `${minutes}m restantes`;
  }
}

/**
 * Verifica si una oferta está abierta para postulaciones
 * Las postulaciones se cierran 2 horas antes de la cita
 */
export function isOfferOpenForApplications(dateTime: string): boolean {
  const offerDate = new Date(dateTime);
  const now = new Date();
  const twoHoursBefore = new Date(offerDate.getTime() - (2 * 60 * 60 * 1000)); // 2 horas antes

  return now < twoHoursBefore;
}

/**
 * Obtiene el tiempo restante para cerrar postulaciones
 */
export function getTimeUntilApplicationsClose(dateTime: string): string {
  const offerDate = new Date(dateTime);
  const now = new Date();
  const twoHoursBefore = new Date(offerDate.getTime() - (2 * 60 * 60 * 1000));

  const timeDiff = twoHoursBefore.getTime() - now.getTime();

  if (timeDiff <= 0) {
    return 'Cerradas';
  }

  const hours = Math.floor(timeDiff / (1000 * 60 * 60));
  const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
} 