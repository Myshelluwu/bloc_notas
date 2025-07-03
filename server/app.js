const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // <-- Agrega esto para parsear JSON
app.use(express.static(path.join(__dirname, '../cliente')));

// Rutas REST
app.use('/api/notes', require('./routes/notes'));
app.use('/api/admin', require('./routes/admin')); // Rutas de administración

// Middleware de errores al final
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('¡Algo salió mal!');
});

app.get('/test', (req, res) => {
    res.send('¡Servidor funcionando!');
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../cliente/admin.html'));
});

module.exports = app;