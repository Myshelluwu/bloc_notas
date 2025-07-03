const { db } = require('../models/firebase-admin');
const notesCollection = db.collection('notes');


// 1. Obtener todas las notas
exports.getAllNotes = async (req, res) => {
    try {
        const snapshot = await notesCollection.get();
        const notes = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.status(200).json(notes);
    } catch (error) {
        console.error("Error en getAllNotes:", error);
        res.status(500).send(error.message);
    }
};

// 2. Crear una nota (ya lo tenías)
exports.createNote = async (req, res) => {
    try {
        const { title, content } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" });
        }

        // Verifica que Firestore esté conectado
        if (!db) {
            throw new Error("Firestore not initialized");
        }

        const noteData = {
            title,
            content,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const docRef = await db.collection('notes').add(noteData);
        console.log("Nota creada con ID:", docRef.id);
        
        // Emitir evento de WebSocket si está disponible
        if (req.app.get('io')) {
            req.app.get('io').emit('note-created', {
                id: docRef.id,
                ...noteData
            });
        }
        
        res.status(201).json({
            message: "Nota creada exitosamente",
            id: docRef.id,
            ...noteData
        });
    } catch (error) {
        console.error("Error detallado:", error);
        
        if (error.code === 5 || error.code === 'NOT_FOUND') {
            res.status(500).json({ 
                error: "Firestore no está configurado correctamente",
                details: "Verifica que la base de datos esté habilitada y las reglas de seguridad"
            });
        } else {
            res.status(500).json({ 
                error: "Error al crear la nota",
                details: error.message 
            });
        }
    }
};

// 3. Actualizar una nota
exports.updateNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content } = req.body;
        console.log("Actualizando nota con ID:", id, "con datos:", { title, content });
        
        const updateData = {
            title,
            content,
            updatedAt: new Date()
        };
        
        await notesCollection.doc(id).update(updateData);
        
        // Emitir evento de WebSocket si está disponible
        if (req.app.get('io')) {
            req.app.get('io').emit('note-updated', {
                id,
                ...updateData
            });
        }
        
        res.status(200).json({ message: "Nota actualizada", id });
    } catch (error) {
        console.error("Error en updateNote:", error);
        res.status(500).send(error.message);
    }
};

// 4. Eliminar una nota
exports.deleteNote = async (req, res) => {
    try {
        const { id } = req.params;

        await notesCollection.doc(id).delete();
        
        // Emitir evento de WebSocket si está disponible
        if (req.app.get('io')) {
            req.app.get('io').emit('note-deleted', id);
        }
        
        res.status(200).json({ message: "Nota eliminada", id });
    } catch (error) {
        console.error("Error en deleteNote:", error);
        res.status(500).send(error.message);
    }
};

// 5. Obtener una nota específica
exports.getNoteById = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await notesCollection.doc(id).get();
        
        if (!doc.exists) {
            return res.status(404).json({ error: "Nota no encontrada" });
        }
        
        res.status(200).json({
            id: doc.id,
            ...doc.data()
        });
    } catch (error) {
        console.error("Error en getNoteById:", error);
        res.status(500).send(error.message);
    }
};

// 6. Obtener estadísticas de notas
exports.getNotesStats = async (req, res) => {
    try {
        const snapshot = await notesCollection.get();
        const totalNotes = snapshot.size;
        
        // Calcular estadísticas
        const notes = snapshot.docs.map(doc => doc.data());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const notesToday = notes.filter(note => {
            const createdAt = note.createdAt ? new Date(note.createdAt.toDate()) : new Date();
            return createdAt >= today;
        }).length;
        
        const notesThisWeek = notes.filter(note => {
            const createdAt = note.createdAt ? new Date(note.createdAt.toDate()) : new Date();
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return createdAt >= weekAgo;
        }).length;
        
        res.status(200).json({
            totalNotes,
            notesToday,
            notesThisWeek,
            averageNotesPerDay: totalNotes > 0 ? (totalNotes / Math.max(1, Math.ceil((Date.now() - new Date(notes[0]?.createdAt?.toDate() || Date.now()).getTime()) / (24 * 60 * 60 * 1000)))).toFixed(2) : 0
        });
    } catch (error) {
        console.error("Error en getNotesStats:", error);
        res.status(500).send(error.message);
    }
};
