# Panel de Administración - Bloc de Notas

## Descripción

El panel de administración es una interfaz web moderna y funcional que permite monitorear y gestionar la aplicación de bloc de notas en tiempo real. Proporciona estadísticas, gestión de notas, monitoreo de clientes y logs del servidor.

## Características

### 📊 Dashboard
- **Estadísticas en tiempo real**: Total de notas, clientes activos, tiempo de actividad del servidor
- **Gráfico de actividad**: Visualización de la actividad reciente
- **Actividad reciente**: Lista de las últimas acciones realizadas
- **Estado de la base de datos**: Monitoreo del estado de conexión

### 📝 Gestión de Notas
- **Vista de tabla**: Todas las notas con información detallada
- **Búsqueda**: Filtrado por título o contenido
- **Ordenamiento**: Por fecha, título o ID
- **Edición**: Modal para editar notas existentes
- **Eliminación**: Eliminar notas con confirmación
- **Actualización en tiempo real**: Cambios reflejados inmediatamente

### 👥 Clientes Conectados
- **Lista de clientes**: Información de todos los clientes conectados
- **Estado de conexión**: Online/Offline en tiempo real
- **Información detallada**: IP, User Agent, tiempo de conexión
- **Actividad reciente**: Última actividad de cada cliente

### 📋 Logs del Servidor
- **Logs en tiempo real**: Eventos del servidor actualizados automáticamente
- **Filtrado por nivel**: Info, Warning, Error
- **Búsqueda**: Buscar en los logs por mensaje
- **Exportación**: Descargar logs en formato HTML
- **Limpieza**: Limpiar logs antiguos


## API Endpoints

### Estadísticas
- `GET /api/admin/stats` - Obtener estadísticas del dashboard
- `GET /api/notes/stats` - Estadísticas específicas de notas

### Clientes
- `GET /api/admin/clients` - Lista de clientes conectados

### Logs
- `GET /api/admin/logs` - Obtener logs del servidor
- `DELETE /api/admin/logs` - Limpiar logs

### Actividad
- `GET /api/admin/activity` - Actividad reciente
- `GET /api/admin/system` - Información del sistema

## WebSocket Events

### Cliente → Servidor
- `admin-join` - Unirse como administrador
- `admin-request-stats` - Solicitar estadísticas
- `admin-request-clients` - Solicitar lista de clientes
- `admin-request-logs` - Solicitar logs

### Servidor → Cliente
- `stats-update` - Actualización de estadísticas
- `clients-update` - Actualización de clientes
- `logs-update` - Actualización de logs
- `server-log` - Nuevo log del servidor
- `client-connected` - Cliente conectado
- `client-disconnected` - Cliente desconectado

## Características Técnicas

### Frontend
- **HTML5**: Estructura semántica moderna
- **CSS3**: Diseño responsivo con Grid y Flexbox
- **JavaScript ES6+**: Funcionalidad interactiva
- **Chart.js**: Gráficos de actividad
- **Font Awesome**: Iconos modernos
- **WebSockets**: Comunicación en tiempo real

### Backend
- **Node.js**: Servidor JavaScript
- **Express.js**: Framework web
- **Socket.io**: WebSockets en tiempo real
- **Firebase Admin**: Base de datos en la nube
- **CORS**: Acceso desde cualquier origen

### Seguridad
- **Middleware de autenticación**: Preparado para implementar autenticación
- **Validación de datos**: Verificación de entrada
- **Manejo de errores**: Gestión robusta de errores
