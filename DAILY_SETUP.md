# Configuración de Daily.co

## Pasos para configurar Daily.co

### 1. Crear cuenta en Daily.co
1. Ve a [daily.co](https://daily.co)
2. Crea una cuenta gratuita
3. Obtén tu API key desde el dashboard

### 2. Configurar variables de entorno
Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Daily.co Configuration
NEXT_PUBLIC_DAILY_API_KEY=tu_api_key_de_daily_aqui

# Existing configurations
STRAPI_URL=http://localhost:1337
```

### 3. Características implementadas
- ✅ Videochat en tiempo real
- ✅ Chat integrado
- ✅ Compartir pantalla
- ✅ Grabación de sesiones
- ✅ Salas privadas
- ✅ Máximo 2 participantes por sesión
- ✅ Expiración automática de salas (2 horas)

### 4. Cómo funciona
1. Cuando ambos usuarios están listos, se crea una sala de Daily
2. La sala se abre en una nueva pestaña
3. Los usuarios pueden usar todas las funciones de Daily
4. Al cerrar la pestaña, se sale de la sala

### 5. Pruebas
Para probar sin API key real, puedes usar:
```env
NEXT_PUBLIC_DAILY_API_KEY=test_key
```

Esto mostrará un mensaje de error pero te permitirá ver la interfaz. 