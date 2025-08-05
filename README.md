# Plataforma de Cuidadores - Irlanda

Una plataforma web completa para conectar clientes con profesionales cuidadores de personas mayores en Irlanda.

## 🚀 Características

### Para Clientes
- ✅ Registro/login con Clerk
- ✅ Publicar ofertas de trabajo
- ✅ Filtrar profesionales por precio, rating, experiencia
- ✅ Sistema de pagos seguro con Stripe
- ✅ Sistema de reseñas y calificaciones
- ✅ Notificaciones por email

### Para Profesionales
- ✅ Registro con verificación de documentos
- ✅ Subida de documentos a Cloudinary
- ✅ Perfil profesional con skills y disponibilidad
- ✅ Postulación a ofertas de trabajo
- ✅ Sistema de pagos y tracking de horas
- ✅ Historial de trabajos y reseñas

### Para Administradores
- ✅ Panel de administración
- ✅ Aprobación de perfiles profesionales
- ✅ Gestión de disputas y moderación
- ✅ Supervisión de pagos y transacciones

## 🛠️ Tecnologías

### Backend
- **Strapi v5** - CMS headless y API
- **SQLite** - Base de datos (desarrollo)
- **Clerk** - Autenticación
- **Stripe** - Procesamiento de pagos
- **Cloudinary** - Almacenamiento de medios
- **SendGrid** - Enví de emails

### Frontend
- **Next.js 15** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **React Hook Form** - Formularios
- **Zod** - Validación de esquemas
- **Lucide React** - Iconos

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o yarn
- Cuenta en Clerk
- Cuenta en Stripe
- Cuenta en Cloudinary
- Cuenta en SendGrid

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd elder-care-platform
```

### 2. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env
```

Editar `.env` con tus credenciales:

```env
# Database
DATABASE_CLIENT=sqlite
DATABASE_FILENAME=.tmp/data.db

# Server
HOST=0.0.0.0
PORT=1337
APP_KEYS=your-app-keys-here
API_TOKEN_SALT=your-api-token-salt-here
ADMIN_JWT_SECRET=your-admin-jwt-secret-here
JWT_SECRET=your-jwt-secret-here

# Clerk Authentication
CLERK_JWT_KEY=your-clerk-jwt-key-here
CLERK_ISSUER_URL=https://your-clerk-instance.clerk.accounts.dev
CLERK_AUDIENCE=your-audience-here

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret-here
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here

# Cloudinary
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_KEY=your-cloudinary-key
CLOUDINARY_SECRET=your-cloudinary-secret

# Email (SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# CORS
CORS_ORIGIN=http://localhost:3000
```

### 3. Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env.local
cp .env.local.example .env.local
```

Editar `.env.local`:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key-here
CLERK_SECRET_KEY=your-clerk-secret-key-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:1337

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here
```

### 4. Iniciar el desarrollo

```bash
# Terminal 1 - Backend
cd backend
npm run develop

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🔧 Configuración de Servicios

### Clerk
1. Crear cuenta en [clerk.com](https://clerk.com)
2. Crear una nueva aplicación
3. Configurar los dominios permitidos
4. Obtener las claves de API

### Stripe
1. Crear cuenta en [stripe.com](https://stripe.com)
2. Obtener las claves de API (test y live)
3. Configurar webhooks para el endpoint `/api/payments/webhook`

### Cloudinary
1. Crear cuenta en [cloudinary.com](https://cloudinary.com)
2. Obtener las credenciales de API
3. Configurar el preset para uploads

### SendGrid
1. Crear cuenta en [sendgrid.com](https://sendgrid.com)
2. Verificar el dominio de email
3. Obtener la API key

## 📁 Estructura del Proyecto

```
elder-care-platform/
├── backend/                 # Strapi CMS
│   ├── src/
│   │   ├── api/            # Modelos y controladores
│   │   ├── components/     # Componentes reutilizables
│   │   ├── policies/       # Políticas de autorización
│   │   └── middlewares/    # Middlewares personalizados
│   └── config/             # Configuraciones
├── frontend/               # Next.js App
│   ├── src/
│   │   ├── app/           # Páginas y layouts
│   │   ├── components/    # Componentes React
│   │   └── lib/           # Utilidades y configuraciones
│   └── public/            # Archivos estáticos
└── README.md
```

## 🚀 Despliegue

### Backend (Strapi)
```bash
cd backend
npm run build
npm run start
```

### Frontend (Next.js)
```bash
cd frontend
npm run build
npm run start
```

## 📝 Modelos de Datos

### UserProfile
- Información personal del usuario
- Rol (cliente, profesional, admin)
- Estado (pendiente, aprobado, suspendido)
- Documentos y verificaciones

### Oferta
- Ofertas de trabajo publicadas por clientes
- Estado y gestión de postulaciones
- Integración con pagos

### Review
- Sistema de reseñas y calificaciones
- Comentarios y respuestas

## 🔐 Seguridad

- Autenticación con Clerk
- Autorización basada en roles
- Validación de datos con Zod
- Protección CSRF
- Sanitización de inputs

## 📧 Notificaciones

El sistema envía emails automáticos para:
- Aprobación de perfiles
- Nuevas ofertas
- Nuevas postulaciones
- Confirmación de pagos
- Recordatorios de reseñas

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🆘 Soporte

Para soporte técnico, contacta a:
- Email: soporte@eldercare-ireland.com
- Documentación: [docs.eldercare-ireland.com](https://docs.eldercare-ireland.com) 