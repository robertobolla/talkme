import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware((auth, req) => {
  const { pathname } = req.nextUrl;

  // Rutas públicas que no requieren autenticación
  const publicRoutes = ["/", "/api/status", "/api/health", "/api/sessions", "/api/test", "/api/daily"];

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return;
  }

  // Para todas las demás rutas, Clerk manejará la autenticación automáticamente
  // La verificación de perfil se hará en el cliente usando el hook useProfileCheck
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 