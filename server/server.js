const app = require('./app');
const http = require('http');
const socketIO = require('socket.io');

const server = http.createServer(app);
const io = socketIO(server, {
  cors: { origin: '*' } // Permite conexiones desde cualquier origen (en desarrollo)
});

// Configuración de WebSocket
require('./sockets/notes')(io);

// Hacer io disponible para las rutas
app.set('io', io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`👑 Panel de administración: http://localhost:${PORT}/admin`);
    console.log(`📝 Aplicación de notas: http://localhost:${PORT}`);
});

//    console.log(`Servidor corriendo en http://178.16.142.158:${PORT}`);


