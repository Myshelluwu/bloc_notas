# 📝 Bloc de Notas - Aplicación SOA

## Descripción

Este es un proyecto que implementa una aplicación de bloc de notas en tiempo real con capacidades de administración avanzadas. La aplicación permite a los usuarios crear, editar y gestionar notas de forma colaborativa, mientras que los administradores pueden monitorear toda la actividad del sistema.

## 🏗️ Arquitectura del Sistema

### Componentes Principales

1. **Cliente Web** - Interfaz de usuario para crear y gestionar notas
2. **Servidor Backend** - API REST y WebSockets para comunicación en tiempo real
3. **Panel de Administración** - Dashboard completo para monitoreo y gestión
4. **Base de Datos** - Firebase Firestore para persistencia de datos

### Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Backend**: Node.js, Express.js
- **Comunicación en Tiempo Real**: Socket.io
- **Base de Datos**: Firebase Firestore
- **Iconos**: Font Awesome
- **Gráficos**: Chart.js

## 🚀 Características Principales

### Para Usuarios
- ✏️ **Crear y editar notas** en tiempo real
- 📱 **Interfaz responsiva** que funciona en cualquier dispositivo
- 🔄 **Sincronización automática** entre todos los clientes
- 💾 **Persistencia de datos** en la nube
- 🔗 **Indicador de conexión** en tiempo real

### Para Administradores
- 📊 **Dashboard con estadísticas** en tiempo real
- 👥 **Monitoreo de clientes** conectados
- 📝 **Gestión completa de notas** (ver, editar, eliminar)
- 📋 **Logs del servidor** con filtrado y exportación
- 📈 **Gráficos de actividad** del sistema


## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js (versión 14 o superior)
- npm o yarn
- Cuenta de Firebase (para la base de datos)

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd bloc_notas
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar Firebase**
   - Crear un proyecto en Firebase Console
   - Habilitar Firestore Database
   - Descargar la clave de servicio y guardarla como `firebase-key.json`

4. **Iniciar el servidor**
   ```bash
   npm start
   ```

5. **Acceder a la aplicación**
   - **Aplicación principal**: http://localhost:3000
   - **Panel de administración**: http://localhost:3000/admin

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor principal
- `npm run kiki` - Inicia el cliente (para desarrollo)
- `npm test` - Ejecuta las pruebas (pendiente de implementar)

## 🌐 API Endpoints

### Notas
- `GET /api/notes` - Obtener todas las notas
- `POST /api/notes` - Crear una nueva nota
- `PUT /api/notes/:id` - Actualizar una nota
- `DELETE /api/notes/:id` - Eliminar una nota

### Administración
- `GET /api/admin/stats` - Estadísticas del sistema
- `GET /api/admin/clients` - Clientes conectados
- `GET /api/admin/logs` - Logs del servidor
- `GET /api/admin/activity` - Actividad reciente

## 🔌 WebSockets

### Eventos del Cliente
- `save-note` - Guardar una nueva nota
- `update-note` - Actualizar una nota existente
- `delete-note` - Eliminar una nota
- `admin-join` - Unirse como administrador

### Eventos del Servidor
- `notes-update` - Actualización de notas
- `note-saved` - Nota guardada exitosamente
- `note-updated` - Nota actualizada exitosamente
- `note-deleted` - Nota eliminada exitosamente
- `stats-update` - Actualización de estadísticas

## 🐳 Docker

El proyecto incluye un Dockerfile para facilitar el despliegue:

```bash
# Construir la imagen
docker build -t bloc-notas .

# Ejecutar el contenedor
docker run -p 3000:3000 bloc-notas
```

## 🔒 Seguridad

- **CORS habilitado** para desarrollo
- **Validación de datos** en el servidor
- **Manejo de errores** robusto
- **Middleware de autenticación** preparado para implementar

## 📊 Monitoreo y Logs

El sistema incluye un sistema completo de logging que permite:
- Monitorear actividad en tiempo real
- Filtrar logs por nivel (Info, Warning, Error)
- Exportar logs en formato HTML
- Limpiar logs antiguos automáticamente

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## 👨‍💻 Autor

**Myshelluwu** - [GitHub](https://github.com/Myshelluwu)
