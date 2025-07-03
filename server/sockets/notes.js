const { db } = require('../models/firebase-admin');

module.exports = (io) => {
    // Almacenar información de clientes conectados
    const connectedClients = new Map();
    let adminClients = new Set();

    // Escucha cambios en Firestore y los emite via WebSocket
    db.collection('notes').onSnapshot((snapshot) => {
        const changes = snapshot.docChanges();
        changes.forEach(change => {
        if (change.type === 'added') {
            const noteData = { id: change.doc.id, ...change.doc.data() };
            io.emit('note-added', noteData); // Envía a TODOS los clientes
        }
        if (change.type === 'modified') {
            const noteData = { id: change.doc.id, ...change.doc.data() };
            io.emit('note-updated', noteData); // Envía a TODOS los clientes
        }
        if (change.type === 'removed') {
            const noteData = { id: change.doc.id, ...change.doc.data() };
            io.emit('note-removed', noteData); // Envía a TODOS los clientes
        }
        });
    });

    io.on('connection', (socket) => {
        console.log('👉 Cliente conectado:', socket.id);
        
        // Registrar cliente
        const clientInfo = {
            id: socket.id,
            connectedAt: new Date(),
            lastActivity: new Date(),
            ip: socket.handshake.address,
            userAgent: socket.handshake.headers['user-agent'],
            isAdmin: false
        };
        
        connectedClients.set(socket.id, clientInfo);
        
        // Notificar a clientes admin sobre nueva conexión
        adminClients.forEach(adminId => {
            io.to(adminId).emit('client-connected', clientInfo);
        });

        // Manejar la carga de notas existentes
        socket.on('load-notes', async () => {
            try {
                console.log('📝 Cargando notas existentes...');
                const snapshot = await db.collection('notes').get();
                const notes = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                console.log(`📝 Se cargaron ${notes.length} notas`);
                socket.emit('notes-loaded', notes);
            } catch (error) {
                console.error('❌ Error al cargar notas:', error);
                socket.emit('error', { message: 'Error al cargar las notas' });
            }
        });

        // Manejar creación de notas
        socket.on('create-note', async (noteData) => {
            try {
                console.log('📝 Creando nueva nota:', noteData);
                const docRef = await db.collection('notes').add({
                    title: noteData.title,
                    content: noteData.content,
                    createdAt: noteData.createdAt || new Date().toISOString()
                });
                const newNote = {
                    id: docRef.id,
                    title: noteData.title,
                    content: noteData.content,
                    createdAt: noteData.createdAt || new Date().toISOString()
                };
                socket.emit('note-created', newNote);
                
                // Notificar a clientes admin
                adminClients.forEach(adminId => {
                    io.to(adminId).emit('server-log', {
                        timestamp: new Date(),
                        level: 'info',
                        message: `Nota creada: ${noteData.title}`,
                        source: 'api'
                    });
                });
            } catch (error) {
                console.error('❌ Error al crear nota:', error);
                socket.emit('error', { message: 'Error al crear la nota' });
            }
        });

        // Manejar eliminación de notas
        socket.on('delete-note', async (noteId) => {
            try {
                console.log('🗑️ Eliminando nota:', noteId);
                await db.collection('notes').doc(noteId).delete();
                // Emitir a todos los clientes, no solo al que eliminó
                io.emit('note-deleted', noteId);
                
                // Notificar a clientes admin
                adminClients.forEach(adminId => {
                    io.to(adminId).emit('server-log', {
                        timestamp: new Date(),
                        level: 'info',
                        message: `Nota eliminada: ${noteId}`,
                        source: 'api'
                    });
                });
            } catch (error) {
                console.error('❌ Error al eliminar nota:', error);
                socket.emit('error', { message: 'Error al eliminar la nota' });
            }
        });

        // Manejar actualización de notas
        socket.on('update-note', async (noteData) => {
            try {
                console.log('✏️ Actualizando nota:', noteData);
                await db.collection('notes').doc(noteData.id).update({
                    title: noteData.title,
                    content: noteData.content,
                    updatedAt: new Date().toISOString()
                });
                // Emitir a todos los clientes
                io.emit('note-updated', {
                    id: noteData.id,
                    title: noteData.title,
                    content: noteData.content,
                    updatedAt: new Date().toISOString()
                });
                
                // Notificar a clientes admin
                adminClients.forEach(adminId => {
                    io.to(adminId).emit('server-log', {
                        timestamp: new Date(),
                        level: 'info',
                        message: `Nota actualizada: ${noteData.title}`,
                        source: 'api'
                    });
                });
            } catch (error) {
                console.error('❌ Error al actualizar nota:', error);
                socket.emit('error', { message: 'Error al actualizar la nota' });
            }
        });

        // Eventos específicos para el panel de administración
        socket.on('admin-join', () => {
            console.log('👑 Cliente admin conectado:', socket.id);
            adminClients.add(socket.id);
            clientInfo.isAdmin = true;
            
            // Enviar información actual de clientes
            const clients = Array.from(connectedClients.values());
            socket.emit('clients-update', clients);
            
            // Enviar estadísticas actuales
            sendAdminStats(socket);
        });

        socket.on('admin-request-stats', () => {
            sendAdminStats(socket);
        });

        socket.on('admin-request-clients', () => {
            const clients = Array.from(connectedClients.values());
            socket.emit('clients-update', clients);
        });

        socket.on('admin-request-logs', () => {
            // Enviar logs recientes (simulados por ahora)
            const logs = [
                {
                    timestamp: new Date(Date.now() - 1000),
                    level: 'info',
                    message: 'Servidor funcionando correctamente',
                    source: 'server'
                },
                {
                    timestamp: new Date(Date.now() - 5000),
                    level: 'info',
                    message: `Cliente conectado: ${socket.id}`,
                    source: 'websocket'
                }
            ];
            socket.emit('logs-update', logs);
        });

        // Actualizar actividad del cliente
        socket.on('activity', () => {
            if (connectedClients.has(socket.id)) {
                const client = connectedClients.get(socket.id);
                client.lastActivity = new Date();
                connectedClients.set(socket.id, client);
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ Cliente desconectado:', socket.id);
            
            // Remover de clientes admin si es admin
            adminClients.delete(socket.id);
            
            // Notificar a otros clientes admin
            adminClients.forEach(adminId => {
                io.to(adminId).emit('client-disconnected', socket.id);
                io.to(adminId).emit('server-log', {
                    timestamp: new Date(),
                    level: 'info',
                    message: `Cliente desconectado: ${socket.id}`,
                    source: 'websocket'
                });
            });
            
            // Remover cliente de la lista
            connectedClients.delete(socket.id);
        });
    });

    // Función para enviar estadísticas a clientes admin
    async function sendAdminStats(socket) {
        try {
            const snapshot = await db.collection('notes').get();
            const totalNotes = snapshot.size;
            
            const stats = {
                totalNotes,
                connectedClients: connectedClients.size,
                adminClients: adminClients.size,
                serverUptime: process.uptime(),
                timestamp: Date.now()
            };
            
            socket.emit('stats-update', stats);
        } catch (error) {
            console.error('Error enviando estadísticas:', error);
        }
    }

    // Hacer disponible la información de clientes para las rutas
    io.getConnectedClients = () => Array.from(connectedClients.values());
    io.getAdminClients = () => Array.from(adminClients);
};