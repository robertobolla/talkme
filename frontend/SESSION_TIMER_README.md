# Sistema de Contador Global de Sesiones

## Descripción

Este sistema implementa un contador global sincronizado para las sesiones de videochat, que se mantiene consistente entre todos los usuarios y páginas, incluso cuando se recargan las páginas.

## Características

- **Contador Global**: El tiempo se mantiene en el backend, no en el frontend
- **Sincronización en Tiempo Real**: Todos los usuarios ven el mismo contador
- **Cierre Automático**: Las sesiones se cierran automáticamente cuando expiran
- **Estado Persistente**: El estado se mantiene aunque se recargue la página
- **Limpieza Automática**: Sistema de limpieza para sesiones expiradas

## Componentes Principales

### 1. API de Estado de Sesión (`/api/sessions/[id]/ready`)

Mantiene el estado global de cada sesión:
- Estado de "listo" de cada usuario
- Tiempo de inicio y fin
- Estado de la sesión (waiting, ready, expired)

### 2. Hook `useSessionReady`

Gestiona el estado local del modal y se sincroniza con el backend:
- Detecta sesiones próximas
- Sincroniza estado cada 2 segundos
- Maneja apertura/cierre del modal

### 3. Modal `SessionReadyModal`

Interfaz de usuario que muestra:
- Contador global sincronizado
- Estado de ambos usuarios
- Botones de acción

### 4. Sistema de Limpieza

- **Endpoint de limpieza manual**: `/api/sessions/cleanup`
- **Endpoint de cron job**: `/api/cron/cleanup-sessions`
- Marca sesiones como expiradas automáticamente

## Configuración

### Variables de Entorno

```bash
# Backend Strapi
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_token

# Para cron jobs (opcional)
CRON_SECRET_TOKEN=your_secret_token
```

### Configuración de Cron Job

Para limpieza automática, configurar un cron job que llame:

```bash
# Cada 5 minutos
*/5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET_TOKEN" https://your-domain.com/api/cron/cleanup-sessions
```

## Flujo de Funcionamiento

1. **Detección de Sesión Próxima**: El hook detecta sesiones que están por comenzar (1-5 minutos antes)
2. **Apertura del Modal**: Se abre automáticamente para ambos usuarios
3. **Sincronización**: El estado se sincroniza cada 2 segundos con el backend
4. **Marcado de Listo**: Cada usuario puede marcar que está listo
5. **Confirmación Automática**: Si es acompañante con sesión pending, se confirma automáticamente
6. **Apertura del Videochat**: Cuando ambos están listos, se abre automáticamente
7. **Cierre Automático**: La sesión se cierra cuando expira

## Ventajas del Sistema

- **Consistencia**: Todos los usuarios ven el mismo tiempo
- **Persistencia**: Funciona aunque se recargue la página
- **Automatización**: Cierre automático de sesiones expiradas
- **Sincronización**: Estado real-time entre usuarios
- **Escalabilidad**: Fácil de extender para más funcionalidades

## Debug y Testing

### Controles de Debug

En modo desarrollo, se muestran controles para:
- Forzar apertura del modal
- Probar sesiones próximas
- Ejecutar limpieza manual
- Ver estado del sistema

### Logs

El sistema genera logs detallados para:
- Apertura/cierre de modales
- Cambios de estado
- Sincronización
- Errores y excepciones

## Mantenimiento

### Limpieza de Timers

Los timers se limpian automáticamente:
- Sesiones expiradas se eliminan
- Timers antiguos (>1 hora) se limpian
- Estado se mantiene consistente

### Monitoreo

Endpoints para monitorear:
- `/api/sessions/cleanup` - Estado de limpieza
- `/api/cron/cleanup-sessions` - Limpieza automática

## Consideraciones de Producción

- **Base de Datos**: En producción, usar base de datos en lugar de Map en memoria
- **Redis**: Considerar Redis para estado distribuido
- **WebSockets**: Para sincronización más eficiente
- **Rate Limiting**: Proteger endpoints de limpieza
- **Logging**: Implementar logging estructurado
- **Métricas**: Monitorear rendimiento y uso 