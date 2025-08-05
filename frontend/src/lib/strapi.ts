// Configuración para conectar con Strapi
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || 'http://localhost:1337';

console.log('Strapi URL configurada:', STRAPI_URL);

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiData<T> {
  id: number;
  attributes: T;
  createdAt: string;
  updatedAt: string;
}

// Tipos para los datos de Strapi
export interface UserProfileAttributes {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  bio?: string;
  dateOfBirth?: string;
  role: 'client' | 'professional' | 'admin';
  clerkUserId: string;
  hourlyRate?: number;
  skills?: string[];
  workZones?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  status: 'pending' | 'approved' | 'suspended';
  averageRating?: number;
  totalHoursWorked?: number;
}

export interface OfferAttributes {
  title: string;
  description: string;
  location: string;
  dateTime: string;
  duration: number;
  status: 'published' | 'cancelled' | 'accepted' | 'completed';
  specialRequirements?: string;
  paymentCompleted: boolean;
  stripePaymentIntentId?: string;
  client?: StrapiData<UserProfileAttributes>;
  professional?: StrapiData<UserProfileAttributes>;
  applicants?: StrapiData<UserProfileAttributes>[];
}

// Funciones de localStorage como fallback
const localStorageApi = {
  getUserProfile: (clerkUserId: string): StrapiData<UserProfileAttributes> | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(`profile_${clerkUserId}`);
    return data ? JSON.parse(data) : null;
  },

  saveUserProfile: (profileData: Partial<UserProfileAttributes>): StrapiData<UserProfileAttributes> | null => {
    if (typeof window === 'undefined') return null;
    const id = Date.now();
    const profile = {
      id,
      attributes: profileData as UserProfileAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`profile_${profileData.clerkUserId}`, JSON.stringify(profile));
    return profile;
  },

  getOffers: (userRole?: string, userId?: string): StrapiData<OfferAttributes>[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('offers');
    const offers = data ? JSON.parse(data) : [];

    if (userRole === 'client' && userId) {
      return offers.filter((offer: any) => offer.attributes.clientId === userId);
    }
    return offers;
  },

  createOffer: (offerData: Partial<OfferAttributes>, clerkUserId: string): StrapiData<OfferAttributes> | null => {
    if (typeof window === 'undefined') return null;
    const id = Date.now();
    const offer = {
      id,
      attributes: {
        ...offerData,
        clientId: clerkUserId,
        status: 'published',
        paymentCompleted: false
      } as OfferAttributes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const existingOffers = localStorageApi.getOffers();
    existingOffers.push(offer);
    localStorage.setItem('offers', JSON.stringify(existingOffers));

    return offer;
  }
};

// Funciones para conectar con Strapi usando APIs estándar con fallback a localStorage
export const strapiApi = {
  // Obtener perfil de usuario por Clerk ID
  async getUserProfile(clerkUserId: string): Promise<StrapiData<UserProfileAttributes> | null> {
    try {
      const response = await fetch(`${STRAPI_URL}/api/user-profiles?filters[clerkUserId][$eq]=${clerkUserId}&populate=*`);

      if (response.ok) {
        const data: StrapiResponse<StrapiData<UserProfileAttributes>[]> = await response.json();
        if (data.data && data.data.length > 0) {
          return data.data[0];
        }
      }

      // Fallback a localStorage
      console.log('Strapi no disponible, usando localStorage');
      return localStorageApi.getUserProfile(clerkUserId);
    } catch (error) {
      console.error('Error fetching user profile from Strapi:', error);
      // Fallback a localStorage
      return localStorageApi.getUserProfile(clerkUserId);
    }
  },

  // Crear o actualizar perfil de usuario
  async saveUserProfile(profileData: Partial<UserProfileAttributes>): Promise<StrapiData<UserProfileAttributes> | null> {
    try {
      const existingProfile = await this.getUserProfile(profileData.clerkUserId!);

      if (existingProfile && existingProfile.id) {
        // Actualizar perfil existente
        const response = await fetch(`${STRAPI_URL}/api/user-profiles/${existingProfile.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: profileData }),
        });

        if (response.ok) {
          const data: StrapiResponse<StrapiData<UserProfileAttributes>> = await response.json();
          return data.data;
        }
      } else {
        // Crear nuevo perfil
        const response = await fetch(`${STRAPI_URL}/api/user-profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: profileData }),
        });

        if (response.ok) {
          const data: StrapiResponse<StrapiData<UserProfileAttributes>> = await response.json();
          return data.data;
        }
      }

      // Fallback a localStorage
      console.log('Strapi no disponible, usando localStorage');
      return localStorageApi.saveUserProfile(profileData);
    } catch (error) {
      console.error('Error saving user profile to Strapi:', error);
      // Fallback a localStorage
      return localStorageApi.saveUserProfile(profileData);
    }
  },

  // Obtener ofertas
  async getOffers(userRole?: string, userId?: string): Promise<StrapiData<OfferAttributes>[]> {
    try {
      let url = `${STRAPI_URL}/api/ofertas?populate=client,professional,applicants`;

      // Si es cliente, solo mostrar sus ofertas
      if (userRole === 'client' && userId) {
        // Primero obtener el perfil del usuario para obtener su ID en Strapi
        const userProfile = await this.getUserProfile(userId);
        if (userProfile) {
          // Filtrar por el ID del perfil del cliente en Strapi
          url += `&filters[client][id][$eq]=${userProfile.id}`;
        }
      }

      console.log('Strapi getOffers: URL:', url);

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        console.log('Strapi getOffers: Respuesta completa:', data);

        // Manejar diferentes formatos de respuesta
        let offers = [];
        if (data.data) {
          // Formato estándar de Strapi
          offers = data.data || [];
        } else if (data.results) {
          // Formato alternativo usado por ofertas
          offers = data.results || [];
        }

        console.log('Strapi getOffers: Ofertas encontradas:', offers.length);
        return offers;
      }

      // Fallback a localStorage
      console.log('Strapi no disponible, usando localStorage');
      return localStorageApi.getOffers(userRole, userId);
    } catch (error) {
      console.error('Error fetching offers from Strapi:', error);
      // Fallback a localStorage
      return localStorageApi.getOffers(userRole, userId);
    }
  },

  // Crear oferta
  async createOffer(offerData: Partial<OfferAttributes>, clerkUserId: string): Promise<StrapiData<OfferAttributes> | null> {
    try {
      // Primero obtener el perfil del cliente
      const userProfile = await this.getUserProfile(clerkUserId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const response = await fetch(`${STRAPI_URL}/api/ofertas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            ...offerData,
            clerkUserId: clerkUserId, // Enviar clerkUserId para que el backend pueda asociar con el cliente
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Manejar diferentes formatos de respuesta
        if (data.data) {
          return data.data;
        } else if (data.results) {
          return data.results;
        }
      }

      // Fallback a localStorage
      console.log('Strapi no disponible, usando localStorage');
      return localStorageApi.createOffer(offerData, clerkUserId);
    } catch (error) {
      console.error('Error creating offer in Strapi:', error);
      // Fallback a localStorage
      return localStorageApi.createOffer(offerData, clerkUserId);
    }
  },

  // Calcular precio de una oferta basado en el profesional asignado
  calculateOfferPrice(offer: StrapiData<OfferAttributes>): { hourlyRate: number; totalPrice: number } | null {
    if (!offer.attributes.professional) {
      return null; // No hay profesional asignado
    }

    const professional = offer.attributes.professional;
    const hourlyRate = professional.attributes.hourlyRate || 0;
    const duration = offer.attributes.duration || 0;
    const totalPrice = hourlyRate * duration;

    return {
      hourlyRate,
      totalPrice
    };
  },

  // Aplicar a una oferta
  async applyToOffer(offerId: number, clerkUserId: string): Promise<boolean> {
    try {
      const userProfile = await this.getUserProfile(clerkUserId);
      if (!userProfile) {
        throw new Error('User profile not found');
      }

      const response = await fetch(`${STRAPI_URL}/api/ofertas/${offerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            applicants: {
              connect: [userProfile.id],
            },
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error applying to offer in Strapi:', error);
      return false;
    }
  },
};

export default strapiApi; 