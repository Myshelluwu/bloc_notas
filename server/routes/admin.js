const express = require('express');
const router = express.Router();
const { db } = require('../models/firebase-admin');

// Middleware para verificar si es admin (en producción deberías implementar autenticación)
const isAdmin = (req, res, next) => {
    // Por ahora permitimos acceso a todos, pero en producción deberías verificar roles
    next();
};

// Obtener estadísticas del dashboard
router.get('/stats', isAdmin, async (req, res) => {
    try {
        const notesSnapshot = await db.collection('notes').get();
        const totalNotes = notesSnapshot.size;
        
        // Obtener notas de las últimas 24 horas
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentNotes = notesSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.createdAt && new Date(data.createdAt.toDate()) > yesterday;
        }).length;
        
        // Estadísticas de la base de datos
        const dbStatus = {
            connected: true,
            collections: ['notes'],
            totalDocuments: totalNotes
        };
        
        res.json({
            totalNotes,
            recentNotes,
            dbStatus,
            serverUptime: process.uptime(),
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// Obtener clientes conectados
router.get('/clients', isAdmin, (req, res) => {
    try {
        // En un caso real, esto vendría del servidor de WebSockets
        // Por ahora simulamos datos
        const clients = [
            {
                id: 'client-1',
                name: 'Usuario 1',
                status: 'online',
                connectedAt: new Date(Date.now() - 300000),
                lastActivity: new Date(),
                ip: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            {
                id: 'client-2',
                name: 'Usuario 2',
                status: 'online',
                connectedAt: new Date(Date.now() - 600000),
                lastActivity: new Date(Date.now() - 30000),
                ip: '192.168.1.101',
                userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
        ];
        
        res.json(clients);
    } catch (error) {
        console.error('Error obteniendo clientes:', error);
        res.status(500).json({ error: 'Error obteniendo clientes' });
    }
});

// Obtener logs del servidor
router.get('/logs', isAdmin, (req, res) => {
    try {
        const { level, limit = 100 } = req.query;
        
        // En un caso real, esto vendría de un sistema de logging
        // Por ahora simulamos logs
        const logs = [
            {
                timestamp: new Date(Date.now() - 1000),
                level: 'info',
                message: 'Servidor iniciado correctamente',
                source: 'server'
            },
            {
                timestamp: new Date(Date.now() - 5000),
                level: 'info',
                message: 'Cliente conectado: client-1',
                source: 'websocket'
            },
            {
                timestamp: new Date(Date.now() - 10000),
                level: 'warning',
                message: 'Alta latencia detectada en la base de datos',
                source: 'database'
            },
            {
                timestamp: new Date(Date.now() - 15000),
                level: 'error',
                message: 'Error de conexión a Firebase',
                source: 'firebase'
            },
            {
                timestamp: new Date(Date.now() - 20000),
                level: 'info',
                message: 'Nota creada: ID-12345',
                source: 'api'
            }
        ];
        
        // Filtrar por nivel si se especifica
        let filteredLogs = logs;
        if (level && level !== 'all') {
            filteredLogs = logs.filter(log => log.level === level);
        }
        
        // Limitar resultados
        filteredLogs = filteredLogs.slice(0, parseInt(limit));
        
        res.json(filteredLogs);
    } catch (error) {
        console.error('Error obteniendo logs:', error);
        res.status(500).json({ error: 'Error obteniendo logs' });
    }
});

// Limpiar logs
router.delete('/logs', isAdmin, (req, res) => {
    try {
        // En un caso real, aquí limpiarías los logs del sistema
        console.log('Logs limpiados por administrador');
        res.json({ message: 'Logs limpiados correctamente' });
    } catch (error) {
        console.error('Error limpiando logs:', error);
        res.status(500).json({ error: 'Error limpiando logs' });
    }
});

// Obtener actividad reciente
router.get('/activity', isAdmin, async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        
        const notesSnapshot = await db.collection('notes').get();
        const activities = [];
        
        notesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const createdAt = data.createdAt ? data.createdAt.toDate() : new Date();
            
            if (createdAt > startDate) {
                activities.push({
                    type: 'create',
                    timestamp: createdAt,
                    message: `Nota creada: ${data.title || 'Sin título'}`,
                    noteId: doc.id
                });
            }
        });
        
        // Ordenar por fecha más reciente
        activities.sort((a, b) => b.timestamp - a.timestamp);
        
        res.json(activities.slice(0, 50)); // Limitar a 50 actividades
    } catch (error) {
        console.error('Error obteniendo actividad:', error);
        res.status(500).json({ error: 'Error obteniendo actividad' });
    }
});

// Obtener información del sistema
router.get('/system', isAdmin, (req, res) => {
    try {
        const systemInfo = {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            pid: process.pid,
            environment: process.env.NODE_ENV || 'development'
        };
        
        res.json(systemInfo);
    } catch (error) {
        console.error('Error obteniendo información del sistema:', error);
        res.status(500).json({ error: 'Error obteniendo información del sistema' });
    }
});

module.exports = router; 