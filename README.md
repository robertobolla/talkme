# TalkMe - Plataforma de Acompañamiento Virtual

Una plataforma web completa para conectar usuarios con acompañantes virtuales para sesiones de escucha y compañía.

## 🚀 Características

### Para Usuarios
- ✅ Registro/login con Clerk
- ✅ Recarga de saldo con criptomonedas (USDT)
- ✅ Reserva de sesiones con acompañantes
- ✅ Videochat temporizado con Daily.co
- ✅ Sistema de reseñas y calificaciones
- ✅ Historial de sesiones y pagos

### Para Acompañantes
- ✅ Registro con verificación de documentos
- ✅ Perfil profesional con especialidades
- ✅ Gestión de disponibilidad y tarifas
- ✅ Recepción de ganancias automáticas
- ✅ Sistema de calificaciones y reseñas

### Para Administradores
- ✅ Panel de administración
- ✅ Aprobación de perfiles de acompañantes
- ✅ Gestión de disputas y moderación
- ✅ Supervisión de pagos y transacciones

## 🛠️ Tecnologías

### Backend
- **Strapi v5** - CMS headless y API
- **PostgreSQL** - Base de datos
- **Clerk** - Autenticación
- **Daily.co** - Videochat en tiempo real
- **Criptomonedas** - Pagos con USDT

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
- PostgreSQL
- Cuenta en Clerk
- Cuenta en Daily.co
- Wallet para criptomonedas

### 1. Clonar el repositorio
```bash
git clone https://github.com/robertobolla/talkme.git
cd talkme
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
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=talkme
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-password

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

# Daily.co
DAILY_API_KEY=your-daily-api-key-here
DAILY_API_URL=https://api.daily.co/v1

# CORS
CORS_ORIGIN=http://localhost:3001
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

# Daily.co
NEXT_PUBLIC_DAILY_API_KEY=your-daily-api-key-here
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

### Daily.co
1. Crear cuenta en [daily.co](https://daily.co)
2. Obtener la API key
3. Configurar las salas de videochat

### Criptomonedas
1. Configurar wallet para USDT
2. Implementar webhooks para confirmación de transacciones
3. Configurar direcciones de depósito

## 📁 Estructura del Proyecto

```
talkme/
├── backend/                 # Strapi CMS
│   ├── src/
│   │   ├── api/
│   │   │   ├── session/    # Modelo de sesiones
│   │   │   ├── payment/    # Sistema de pagos
│   │   │   └── user-profile/ # Perfiles de usuario
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
- Rol (user, companion, admin)
- Balance y ganancias totales
- Estado (pendiente, aprobado, suspendido)
- Especialidades y idiomas

### Session
- Sesiones entre usuarios y acompañantes
- Horarios y duración
- Estado y tipo de sesión
- Integración con Daily.co
- Sistema de pagos

### Payment
- Sistema de balance interno
- Depósitos y retiros
- Pagos por sesiones
- Ganancias de acompañantes
- Integración con criptomonedas

## 🔐 Seguridad

- Autenticación con Clerk
- Autorización basada en roles
- Validación de datos con Zod
- Protección CSRF
- Sanitización de inputs
- Verificación de transacciones cripto

## 💰 Sistema de Pagos

### Flujo de Pago
1. Usuario recarga saldo con USDT
2. Reserva sesión con acompañante
3. Se descuenta saldo automáticamente
4. Al finalizar, acompañante recibe ganancia
5. Usuario puede retirar saldo

### Comisiones
- **Plataforma**: 20% del precio de la sesión
- **Acompañante**: 80% del precio de la sesión

## 🎥 Integración de Videochat

### Daily.co
- Salas temporizadas por sesión
- Tokens de acceso seguros
- Expiración automática
- Grabación opcional

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
- Email: soporte@talkme-platform.com
- Documentación: [docs.talkme-platform.com](https://docs.talkme-platform.com)
