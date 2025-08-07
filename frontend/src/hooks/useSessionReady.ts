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

  // Encontrar sesiones que están por comenzar (24 horas antes para testing)
  const getUpcomingSessions = useCallback(() => {
    const now = new Date();
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log('=== CHECKING UPCOMING SESSIONS ===');
    console.log('Current time:', now.toISOString());
    console.log('Twenty four hours from now:', twentyFourHoursFromNow.toISOString());
    console.log('Total sessions:', sessions.length);

    const upcomingSessions = sessions.filter(session => {
      const sessionTime = new Date(session.startTime);
      const isConfirmed = session.status === 'confirmed';
      const isWithinTwentyFourHours = sessionTime <= twentyFourHoursFromNow && sessionTime > now;

      console.log(`Session ${session.id}:`, {
        startTime: session.startTime,
        sessionTime: sessionTime.toISOString(),
        status: session.status,
        isConfirmed,
        isWithinTwentyFourHours,
        timeUntilSession: sessionTime.getTime() - now.getTime(),
        timeUntilSessionMinutes: Math.floor((sessionTime.getTime() - now.getTime()) / (1000 * 60))
      });

      return isConfirmed && isWithinTwentyFourHours;
    });

    console.log('Upcoming sessions found:', upcomingSessions.length);
    return upcomingSessions;
  }, [sessions]);

  // Verificar si es hora de mostrar el modal
  useEffect(() => {
    const upcomingSessions = getUpcomingSessions();

    console.log('=== CHECKING MODAL TRIGGER ===');
    console.log('Upcoming sessions:', upcomingSessions.length);
    console.log('Ready modal open:', readyModalOpen);
    console.log('Video chat open:', videoChatOpen);

    if (upcomingSessions.length > 0 && !readyModalOpen && !videoChatOpen) {
      const session = upcomingSessions[0];
      console.log('Opening ready modal for session:', session.id);
      setCurrentSession(session);
      setReadyModalOpen(true);
      setUserReady(false);
      setOtherPartyReady(false);
    }
  }, [sessions, readyModalOpen, videoChatOpen, getUpcomingSessions]);

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
          }
        } catch (error) {
          console.error('Error checking other party status:', error);
        }
      };

      const interval = setInterval(checkOtherPartyStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [readyModalOpen, userReady, otherPartyReady, currentSession, userId, userRole]);

  // Abrir video chat cuando ambos están listos
  useEffect(() => {
    if (userReady && otherPartyReady && currentSession) {
      setReadyModalOpen(false);
      // Abrir videochat en nueva pestaña
      const videoChatUrl = `/dashboard/videochat/${currentSession.id}?role=${userRole}&userId=${userId}`;
      window.open(videoChatUrl, '_blank');
    }
  }, [userReady, otherPartyReady, currentSession, userRole, userId]);

  const handleReady = useCallback(async () => {
    if (!currentSession) return;

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
        setUserReady(true);
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
  }, [currentSession, userId, userRole]);

  const handleCloseReadyModal = useCallback(() => {
    setReadyModalOpen(false);
    setUserReady(false);
    setOtherPartyReady(false);
  }, []);

  const handleCloseVideoChat = useCallback(() => {
    setVideoChatOpen(false);
    setUserReady(false);
    setOtherPartyReady(false);
    setCurrentSession(null);
  }, []);

  // Función para forzar el modal (para testing)
  const forceOpenModal = useCallback((session: Session) => {
    console.log('Forcing modal open for session:', session.id);
    setCurrentSession(session);
    setReadyModalOpen(true);
    setUserReady(false);
    setOtherPartyReady(false);
  }, []);

  return {
    readyModalOpen,
    videoChatOpen,
    currentSession,
    userReady,
    otherPartyReady,
    handleReady,
    handleNotReady,
    handleCloseReadyModal,
    handleCloseVideoChat,
    forceOpenModal
  };
} 