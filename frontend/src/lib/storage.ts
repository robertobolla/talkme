// Almacenamiento temporal de perfiles (en producción esto sería en la base de datos)
// Usar un Map global para que persista entre requests
declare global {
  var userProfiles: Map<string, any>;
  var userOffers: Map<string, any[]>;
}

// Inicializar el Map global si no existe
if (!global.userProfiles) {
  global.userProfiles = new Map<string, any>();
}

if (!global.userOffers) {
  global.userOffers = new Map<string, any[]>();
}

export const userProfiles = global.userProfiles;
export const userOffers = global.userOffers;

// Función para limpiar todos los perfiles (para testing)
export function clearAllProfiles() {
  const count = userProfiles.size;
  userProfiles.clear();
  return count;
}

// Función para obtener un perfil
export function getProfile(userId: string) {
  return userProfiles.get(userId);
}

// Función para guardar un perfil
export function saveProfile(userId: string, profile: any) {
  userProfiles.set(userId, profile);
}

// Función para obtener ofertas de un usuario
export function getOffers(userId: string) {
  return userOffers.get(userId) || [];
}

// Función para obtener todas las ofertas (para profesionales)
export function getAllOffers() {
  const allOffers = [];
  for (const [ownerId, offers] of userOffers.entries()) {
    allOffers.push(...offers);
  }
  return allOffers;
}

// Función para guardar una oferta
export function saveOffer(userId: string, offer: any) {
  const offers = getOffers(userId);
  const newOffer = {
    ...offer,
    id: Date.now(), // ID temporal
    createdAt: new Date().toISOString(),
    status: 'published'
  };
  offers.push(newOffer);
  userOffers.set(userId, offers);
  return newOffer;
}

// Función para limpiar todas las ofertas (para testing)
export function clearAllOffers() {
  const count = userOffers.size;
  userOffers.clear();
  return count;
} 