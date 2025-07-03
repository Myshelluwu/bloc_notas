// Conexión WebSocket
const socket = io();

// Elementos del DOM
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const saveButton = document.getElementById('save-note');
const cancelButton = document.getElementById('cancel-edit');
const notesContainer = document.getElementById('notes-container');
const statusMessage = document.getElementById('status-message');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const loadingMessage = document.getElementById('loading-message');

// Estado de conexión
let isConnected = false;

// Estado de edición
let editingNoteId = null;
let isEditing = false;

// Configurar eventos de WebSocket
socket.on('connect', () => {
    isConnected = true;
    updateConnectionStatus('Conectado', 'connected');
    showStatus('Conectado al servidor', 'success');
    loadNotes();
});

socket.on('disconnect', () => {
    isConnected = false;
    updateConnectionStatus('Desconectado', 'disconnected');
    showStatus('Desconectado del servidor', 'error');
});

// Eventos de notas
socket.on('notes-loaded', (notes) => {
    displayNotes(notes);
    loadingMessage.style.display = 'none';
});

socket.on('note-added', (note) => {
    showStatus('Nueva nota detectada', 'info');
    addNoteToList(note);
});

socket.on('note-created', (note) => {
    showStatus('Nota creada exitosamente', 'success');
    clearForm();
    // No agregamos la nota aquí porque se agregará automáticamente por note-added
});

socket.on('note-updated', (note) => {
    showStatus('Nota actualizada exitosamente', 'success');
    updateNoteInList(note);
    
    // Si estamos en modo edición, limpiar el formulario
    if (isEditing && editingNoteId === note.id) {
        clearForm();
        cancelButton.style.display = 'none';
    }
});

socket.on('note-deleted', (noteId) => {
    showStatus('Nota eliminada exitosamente', 'success');
    removeNoteFromList(noteId);
});

socket.on('note-removed', (note) => {
    showStatus('Nota eliminada', 'info');
    removeNoteFromList(note.id);
});

socket.on('error', (error) => {
    showStatus(`Error: ${error.message}`, 'error');
});

// Evento para guardar nota
saveButton.addEventListener('click', () => {
    if (!isConnected) {
        showStatus('No hay conexión con el servidor', 'error');
        return;
    }

    const title = noteTitle.value.trim();
    const content = noteContent.value.trim();

    if (!title || !content) {
        showStatus('Por favor completa el título y contenido', 'error');
        return;
    }

    if (isEditing && editingNoteId) {
        // Modo edición
        const updatedNote = {
            id: editingNoteId,
            title: title,
            content: content
        };
        socket.emit('update-note', updatedNote);
    } else {
        // Modo creación
        const note = {
            title: title,
            content: content,
            createdAt: new Date().toISOString()
        };
        socket.emit('create-note', note);
    }
});

// Evento para cancelar edición
cancelButton.addEventListener('click', () => {
    clearForm();
    cancelButton.style.display = 'none';
    showStatus('Edición cancelada', 'info');
});

// Función para cargar notas
function loadNotes() {
    socket.emit('load-notes');
}

// Función para mostrar notas
function displayNotes(notes) {
    notesContainer.innerHTML = '';
    
    if (notes.length === 0) {
        notesContainer.innerHTML = '<p>No hay notas. ¡Crea tu primera nota!</p>';
        return;
    }

    notes.forEach(note => {
        addNoteToList(note);
    });
}

// Función para agregar nota a la lista
function addNoteToList(note) {
    // Verificar si la nota ya existe para evitar duplicados
    const existingNote = document.querySelector(`[data-note-id="${note.id || note._id}"]`);
    if (existingNote) {
        return; // La nota ya existe, no la agregamos de nuevo
    }
    
    const noteElement = createNoteElement(note);
    notesContainer.appendChild(noteElement);
}

// Función para crear elemento de nota
function createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note-item';
    noteDiv.dataset.noteId = note.id || note._id;
    
    const date = new Date(note.createdAt).toLocaleString('es-ES');
    
    noteDiv.innerHTML = `
        <div class="note-header">
            <h3>${escapeHtml(note.title)}</h3>
            <div class="note-actions">
                <button class="edit-btn" onclick="editNote('${note.id || note._id}')">✏️</button>
                <button class="delete-btn" onclick="deleteNote('${note.id || note._id}')">🗑️</button>
            </div>
        </div>
        <p class="note-content">${escapeHtml(note.content)}</p>
        <small class="note-date">Creada: ${date}</small>
    `;
    
    return noteDiv;
}

// Función para actualizar nota en la lista
function updateNoteInList(note) {
    const existingNote = document.querySelector(`[data-note-id="${note.id || note._id}"]`);
    if (existingNote) {
        const newNoteElement = createNoteElement(note);
        existingNote.replaceWith(newNoteElement);
    }
}

// Función para eliminar nota de la lista
function removeNoteFromList(noteId) {
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (noteElement) {
        noteElement.remove();
    }
}

// Función para editar nota
function editNote(noteId) {
    const noteElement = document.querySelector(`[data-note-id="${noteId}"]`);
    if (!noteElement) return;

    // Obtener los datos de la nota
    const titleElement = noteElement.querySelector('h3');
    const contentElement = noteElement.querySelector('.note-content');
    
    if (titleElement && contentElement) {
        // Cargar datos en el formulario
        noteTitle.value = titleElement.textContent;
        noteContent.value = contentElement.textContent;
        
        // Cambiar a modo edición
        isEditing = true;
        editingNoteId = noteId;
        
        // Cambiar texto del botón
        saveButton.textContent = 'Actualizar Nota';
        saveButton.className = 'btn btn-warning';
        
        // Mostrar botón cancelar
        cancelButton.style.display = 'inline-block';
        
        // Enfocar en el título
        noteTitle.focus();
        
        showStatus('Modo edición activado', 'info');
    }
}

// Función para eliminar nota
function deleteNote(noteId) {
    if (confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        socket.emit('delete-note', noteId);
    }
}

// Función para limpiar formulario
function clearForm() {
    noteTitle.value = '';
    noteContent.value = '';
    
    // Resetear modo de edición
    isEditing = false;
    editingNoteId = null;
    
    // Resetear botón
    saveButton.textContent = 'Guardar Nota';
    saveButton.className = 'btn btn-primary';
    
    // Ocultar botón cancelar
    cancelButton.style.display = 'none';
}

// Función para mostrar mensajes de estado
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    setTimeout(() => {
        statusMessage.textContent = '';
        statusMessage.className = '';
    }, 3001);
}

// Función para actualizar estado de conexión
function updateConnectionStatus(text, status) {
    statusText.textContent = text;
    statusDot.className = `status-dot ${status}`;
}

// Función para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Evento para enviar con Enter
noteTitle.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        noteContent.focus();
    }
});

noteContent.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        saveButton.click();
    }
});
