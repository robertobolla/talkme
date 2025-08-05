'use client';

import React, { useState, useEffect } from 'react';
import { X, Video, VideoOff, Mic, MicOff, Phone, MessageCircle, Settings } from 'lucide-react';

interface VideoChatWindowProps {
  session: {
    id: number;
    title: string;
    startTime: string;
    endTime: string;
    duration: number;
    price: number;
    sessionType: 'video' | 'chat';
    companion?: {
      id: number;
      fullName: string;
    };
    user?: {
      id: number;
      fullName: string;
    };
  };
  userRole: 'user' | 'companion';
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoChatWindow({
  session,
  userRole,
  isOpen,
  onClose
}: VideoChatWindowProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0 });

  const otherPartyName = userRole === 'user' 
    ? session.companion?.fullName 
    : session.user?.fullName;

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const sessionEndTime = new Date(session.endTime).getTime();
      const difference = sessionEndTime - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [session.endTime]);

  const formatTime = (hours: number, minutes: number, seconds: number) => {
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5" />
            <span className="font-medium">{session.title}</span>
          </div>
          
          <div className="text-sm text-gray-300">
            Con: {otherPartyName}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Timer */}
          <div className="text-sm">
            <span className="text-gray-300">Tiempo restante: </span>
            <span className="font-mono">
              {formatTime(timeLeft.hours, timeLeft.minutes, timeLeft.seconds)}
            </span>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 relative bg-gray-800">
          {/* Main Video (Other Party) */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-64 h-48 bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-16 h-16 text-gray-400" />
              </div>
              <p className="text-lg font-medium">{otherPartyName}</p>
              <p className="text-sm text-gray-400">Conectando...</p>
            </div>
          </div>

          {/* Self Video (Small) */}
          <div className="absolute bottom-4 right-4">
            <div className="w-32 h-24 bg-gray-700 rounded-lg flex items-center justify-center">
              <Video className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {isChatOpen && (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium">Chat</h3>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="text-center text-gray-500 text-sm">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>El chat estará disponible pronto</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 flex items-center justify-center space-x-4">
        {/* Video Toggle */}
        <button
          onClick={() => setIsVideoEnabled(!isVideoEnabled)}
          className={`p-3 rounded-full ${
            isVideoEnabled 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* Audio Toggle */}
        <button
          onClick={() => setIsAudioEnabled(!isAudioEnabled)}
          className={`p-3 rounded-full ${
            isAudioEnabled 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Chat Toggle */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-3 rounded-full ${
            isChatOpen 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-gray-700 text-white hover:bg-gray-600'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
        </button>

        {/* Settings */}
        <button className="p-3 rounded-full bg-gray-700 text-white hover:bg-gray-600">
          <Settings className="w-5 h-5" />
        </button>

        {/* End Call */}
        <button className="p-3 rounded-full bg-red-600 text-white hover:bg-red-700">
          <Phone className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 