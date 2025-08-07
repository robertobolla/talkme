// Configuración de Daily
const DAILY_API_KEY = process.env.NEXT_PUBLIC_DAILY_API_KEY;
const DAILY_BASE_URL = 'https://api.daily.co/v1';

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  privacy: number;
  properties: {
    exp: number;
    enable_chat: boolean;
    enable_recording: string;
    enable_screenshare: boolean;
    start_video_off: boolean;
    start_audio_off: boolean;
  };
}

interface CreateRoomResponse {
  id: string;
  name: string;
  url: string;
  privacy: number;
  properties: any;
}

export class DailyService {
  private static async makeRequest(endpoint: string, options: RequestInit = {}) {
    if (!DAILY_API_KEY) {
      throw new Error('DAILY_API_KEY no está configurada');
    }

    console.log('Making Daily API request to:', endpoint);
    console.log('API Key:', DAILY_API_KEY.substring(0, 10) + '...');

    const response = await fetch(`${DAILY_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Daily API Error Response:', errorText);
      throw new Error(`Error en Daily API: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  static async createRoom(sessionId: string, sessionName: string): Promise<DailyRoom> {
    // Usar un nombre más simple y válido
    const roomName = `test-room-${Date.now()}`;

    // Petición mínima según la documentación de Daily
    const roomData = {
      name: roomName,
    };

    console.log('Creating room with data:', JSON.stringify(roomData, null, 2));

    const response = await this.makeRequest('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });

    return response as DailyRoom;
  }

  static async getRoom(roomName: string): Promise<DailyRoom | null> {
    try {
      const response = await this.makeRequest(`/rooms/${roomName}`);
      return response as DailyRoom;
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  static async deleteRoom(roomName: string): Promise<void> {
    await this.makeRequest(`/rooms/${roomName}`, {
      method: 'DELETE',
    });
  }

  static async getRoomToken(roomName: string, userId: string, userName: string): Promise<string> {
    const response = await this.makeRequest('/meeting-tokens', {
      method: 'POST',
      body: JSON.stringify({
        room: roomName,
        user_id: userId,
        user_name: userName,
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora
      }),
    });

    return response.token;
  }
}

// Función helper para crear o obtener una sala
export async function getOrCreateRoom(sessionId: string, sessionName: string): Promise<string> {
  const roomName = `session-${sessionId}`;

  // Intentar obtener la sala existente
  let room = await DailyService.getRoom(roomName);

  // Si no existe, crear una nueva
  if (!room) {
    room = await DailyService.createRoom(sessionId, sessionName);
  }

  return room.url;
} 