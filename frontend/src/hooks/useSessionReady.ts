import { useState, useEffect, useCallback } from 'react';

interface Session {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  sessionType: 'video' | 'chat';
  companion?: {
    id: number;
    fullName: string;
  };
  user?: {
    id: number;
    fullName: string;
  };
}

interface UseSessionReadyProps {
  sessions: Session[];
  userRole: 'user' | 'companion';
  userId: number;
}

export function useSessionReady({ sessions, userRole, userId }: UseSessionReadyProps) {
  const [readyModalOpen, setReadyModalOpen] = useState(false);
  const [videoChatOpen, setVideoChatOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [userReady, setUserReady] = useState(false);
  const [otherPartyReady, setOtherPartyReady] = useState(false);
  const [modalDisabled, setModalDisabled] = useState(false);
  const [modalReenableTimer, setModalReenableTimer] = useState<number | null>(null);
  const [processedSessions, setProcessedSessions] = useState<Set<number>>(new Set());

  // Encontrar sesiones que están por comenzar (5 minutos antes para producción)
  const getUpcomingSessions = useCallback(() => {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    const oneMinuteAgo = new Date(now.getTime() - 1 * 60 * 1000);

    console.log('=== CHECKING UPCOMING SESSIONS ===');
    console.log('Current time:', now.toISOString());
    console.log('Five minutes from now:', fiveMinutesFromNow.toISOString());
    console.log('Total sessions:', sessions.length);
    console.log('Modal disabled:', modalDisabled);

    const upcomingSessions = sessions.filter(session => {
      const sessionTime = new Date(session.startTime);
      // Para acompañantes, mostrar modal solo para sesiones confirmed (no pending para evitar loops)
      const isConfirmed = session.status === 'confirmed';
      // Mostrar modal desde 1 minuto antes hasta 5 minutos después del inicio
      const isWithinWindow = sessionTime <= fiveMinutesFromNow && sessionTime >= oneMinuteAgo;

      console.log(`Session ${session.id}:`, {
        startTime: session.startTime,
        sessionTime: sessionTime.toISOString(),
        status: session.status,
        userRole,
        isConfirmed,
        isWithinWindow,
        timeUntilSession: sessionTime.getTime() - now.getTime(),
        timeUntilSessionMinutes: Math.floor((sessionTime.getTime() - now.getTime()) / (1000 * 60))
      });

      return isConfirmed && isWithinWindow;
    });

    console.log('Upcoming sessions found:', upcomingSessions.length);
    return upcomingSessions;
  }, [sessions, modalDisabled, userRole]);

  // Verificar si es hora de mostrar el modal
  useEffect(() => {
    if (modalDisabled) {
      console.log('Modal is disabled, skipping check');
      return;
    }

    // Evitar abrir el modal si ya hay una sesión en proceso
    if (currentSession && (readyModalOpen || videoChatOpen)) {
      console.log('Modal or videochat already open, skipping check');
      return;
    }

    // Limpiar sesiones procesadas que ya no están en la lista actual
    const currentSessionIds = new Set(sessions.map(s => s.id));
    setProcessedSessions(prev => {
      const newProcessed = new Set(prev);
      for (const sessionId of prev) {
        if (!currentSessionIds.has(sessionId)) {
          newProcessed.delete(sessionId);
        }
      }
      return newProcessed;
    });

    const upcomingSessions = getUpcomingSessions();

    console.log('=== CHECKING MODAL TRIGGER ===');
    console.log('Upcoming sessions:', upcomingSessions.length);
    console.log('Ready modal open:', readyModalOpen);
    console.log('Video chat open:', videoChatOpen);

    if (upcomingSessions.length > 0 && !readyModalOpen && !videoChatOpen) {
      const session = upcomingSessions[0];

      // Evitar reabrir modal para sesiones ya procesadas
      if (processedSessions.has(session.id)) {
        console.log(`Session ${session.id} already processed, skipping modal`);
        return;
      }

      console.log('Opening ready modal for session:', session.id);
      setCurrentSession(session);
      setReadyModalOpen(true);
      setUserReady(false);
      setOtherPartyReady(false);
    }
  }, [sessions, readyModalOpen, videoChatOpen, getUpcomingSessions, modalDisabled, currentSession]);

  // Función para cerrar el modal
  const handleCloseReadyModal = useCallback(() => {
    console.log('Closing ready modal');
    setReadyModalOpen(false);
    setUserReady(false);
    setOtherPartyReady(false);
    if (currentSession) {
      setProcessedSessions(prev => new Set([...prev, currentSession.id]));
    }
    setCurrentSession(null);
    // Evitar reapertura inmediata durante 60s
    setModalDisabled(true);
    const timer = window.setTimeout(() => setModalDisabled(false), 60_000);
    if (modalReenableTimer) window.clearTimeout(modalReenableTimer);
    setModalReenableTimer(timer);
  }, [modalReenableTimer, currentSession]);

  // Verificar estado de la otra parte cuando el usuario está listo
  useEffect(() => {
    if (readyModalOpen && userReady && !otherPartyReady && currentSession) {
      const checkOtherPartyStatus = async () => {
        try {
          const response = await fetch(`/api/sessions/${currentSession.id}/ready?userId=${userId}&userRole=${userRole}`);
          if (response.ok) {
            const data = await response.json();
            if (data.otherPartyReady) {
              setOtherPartyReady(true);
            }
            // Verificar si la sesión ha expirado
            if (data.sessionExpired) {
              console.log('Session expired, closing modal');
              handleCloseReadyModal();
            }
          }
        } catch (error) {
          console.error('Error checking other party status:', error);
        }
      };

      const interval = setInterval(checkOtherPartyStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [readyModalOpen, userReady, otherPartyReady, currentSession, userId, userRole, handleCloseReadyModal]);

  // Verificar estado de la sesión periódicamente para sincronización
  useEffect(() => {
    if (currentSession && readyModalOpen) {
      const syncSessionStatus = async () => {
        try {
          const response = await fetch(`/api/sessions/${currentSession.id}/ready?userId=${userId}&userRole=${userRole}`);
          if (response.ok) {
            const data = await response.json();

            console.log('=== SYNC SESSION STATUS ===');
            console.log('Backend data:', data);
            console.log('Current local state:', { userReady, otherPartyReady });

            // Sincronizar estado del usuario
            if (data.userReady !== userReady) {
              console.log(`Updating userReady from ${userReady} to ${data.userReady}`);
              setUserReady(data.userReady);
            }

            // Sincronizar estado de la otra parte
            if (data.otherPartyReady !== otherPartyReady) {
              console.log(`Updating otherPartyReady from ${otherPartyReady} to ${data.otherPartyReady}`);
              setOtherPartyReady(data.otherPartyReady);
            }

            // Verificar si la sesión ha expirado
            if (data.sessionExpired) {
              console.log('Session expired, closing modal');
              handleCloseReadyModal();
            }

            // Verificar si ambos están listos (doble verificación)
            if (data.bothReady && !(userReady && otherPartyReady)) {
              console.log('Backend says both ready but local state disagrees, updating...');
              setUserReady(data.userReady);
              setOtherPartyReady(data.otherPartyReady);
            }
          }
        } catch (error) {
          console.error('Error syncing session status:', error);
        }
      };

      // Sincronizar inmediatamente y luego cada 2 segundos
      syncSessionStatus();
      const interval = setInterval(syncSessionStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [currentSession, readyModalOpen, userId, userRole, userReady, otherPartyReady, handleCloseReadyModal]);

  // Abrir video chat cuando ambos están listos
  useEffect(() => {
    if (userReady && otherPartyReady && currentSession) {
      console.log('=== BOTH USERS READY - OPENING VIDEOCHAT ===');
      console.log('User ready:', userReady);
      console.log('Other party ready:', otherPartyReady);
      console.log('Current session:', currentSession.id);

      // Agregar un pequeño delay para asegurar sincronización
      const delayBeforeOpening = setTimeout(async () => {
        // Verificar una vez más con el backend antes de abrir
        const verifyBothReady = async () => {
          try {
            const response = await fetch(`/api/sessions/${currentSession.id}/ready?userId=${userId}&userRole=${userRole}`);
            if (response.ok) {
              const data = await response.json();

              console.log('Final verification with backend:', data);

              if (data.bothReady) {
                console.log('Backend confirms both users are ready, opening videochat');
                setReadyModalOpen(false);
                // Marcar la sesión como procesada
                if (currentSession) {
                  setProcessedSessions(prev => new Set([...prev, currentSession.id]));
                }
                // Abrir videochat en nueva pestaña
                const videoChatUrl = `/dashboard/videochat/${currentSession.id}?role=${userRole}&userId=${userId}`;
                window.open(videoChatUrl, '_blank');
              } else {
                console.log('Backend says not both ready, waiting...');
                console.log('Backend data:', data);
                // Resetear estado si el backend dice que no están listos
                if (data.userReady !== userReady) {
                  setUserReady(data.userReady);
                }
                if (data.otherPartyReady !== otherPartyReady) {
                  setOtherPartyReady(data.otherPartyReady);
                }
              }
            }
          } catch (error) {
            console.error('Error verifying both users ready:', error);
          }
        };

        verifyBothReady();
      }, 1000); // 1 segundo de delay

      return () => clearTimeout(delayBeforeOpening);
    }
  }, [userReady, otherPartyReady, currentSession, userId, userRole]);

  const handleReady = useCallback(async () => {
    if (!currentSession) return;

    console.log('=== USER MARKING AS READY ===');
    console.log('User ID:', userId);
    console.log('User Role:', userRole);
    console.log('Session ID:', currentSession.id);

    try {
      const response = await fetch(`/api/sessions/${currentSession.id}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userRole,
          isReady: true
        }),
      });

      if (response.ok) {
        console.log('Successfully marked user as ready in backend');

        // Solo actualizar el estado local, no abrir videochat
        // El videochat se abrirá automáticamente cuando ambos estén listos
        setUserReady(true);

        // Si es un acompañante y la sesión está pending, confirmarla automáticamente
        if (userRole === 'companion' && currentSession.status === 'pending') {
          try {
            const confirmResponse = await fetch(`/api/sessions/${currentSession.id}/accept`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            if (confirmResponse.ok) {
              console.log('Session accepted automatically by companion');
              // Cerrar el modal y deshabilitarlo temporalmente para evitar reapertura
              setReadyModalOpen(false);
              setUserReady(false);
              setOtherPartyReady(false);
              setCurrentSession(null);
              setModalDisabled(true);
              const timer = window.setTimeout(() => setModalDisabled(false), 30_000); // 30 segundos
              if (modalReenableTimer) window.clearTimeout(modalReenableTimer);
              setModalReenableTimer(timer);
            }
          } catch (confirmError) {
            console.error('Error accepting session:', confirmError);
          }
        }
      } else {
        console.error('Failed to mark user as ready in backend');
      }
    } catch (error) {
      console.error('Error marking user as ready:', error);
    }
  }, [currentSession, userId, userRole]);

  const handleNotReady = useCallback(async () => {
    if (!currentSession) return;

    try {
      await fetch(`/api/sessions/${currentSession.id}/ready`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userRole,
          isReady: false
        }),
      });
    } catch (error) {
      console.error('Error marking user as not ready:', error);
    }

    setReadyModalOpen(false);
    setUserReady(false);
    setOtherPartyReady(false);
    setCurrentSession(null);
    // Evitar reapertura inmediata durante 60s
    setModalDisabled(true);
    const timer = window.setTimeout(() => setModalDisabled(false), 60_000);
    if (modalReenableTimer) window.clearTimeout(modalReenableTimer);
    setModalReenableTimer(timer);
  }, [currentSession, userId, userRole]);

  const handleCloseVideoChat = useCallback(() => {
    setVideoChatOpen(false);
    setUserReady(false);
    setOtherPartyReady(false);
    setCurrentSession(null);
  }, []);



  return {
    readyModalOpen,
    videoChatOpen,
    currentSession,
    userReady,
    otherPartyReady,
    modalDisabled,
    handleReady,
    handleNotReady,
    handleCloseReadyModal,
    handleCloseVideoChat
  };
} 