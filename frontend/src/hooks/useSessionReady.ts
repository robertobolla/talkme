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

  // Encontrar sesiones que están por comenzar (5 minutos antes)
  const getUpcomingSessions = useCallback(() => {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    return sessions.filter(session => {
      const sessionTime = new Date(session.startTime);
      return session.status === 'confirmed' &&
        sessionTime <= fiveMinutesFromNow &&
        sessionTime > now;
    });
  }, [sessions]);

  // Verificar si es hora de mostrar el modal
  useEffect(() => {
    const upcomingSessions = getUpcomingSessions();

    if (upcomingSessions.length > 0 && !readyModalOpen && !videoChatOpen) {
      const session = upcomingSessions[0];
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
      setVideoChatOpen(true);
    }
  }, [userReady, otherPartyReady, currentSession]);

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

  return {
    readyModalOpen,
    videoChatOpen,
    currentSession,
    userReady,
    otherPartyReady,
    handleReady,
    handleNotReady,
    handleCloseReadyModal,
    handleCloseVideoChat
  };
} 