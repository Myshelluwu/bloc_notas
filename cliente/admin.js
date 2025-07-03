// Configuración global
const API_BASE_URL = '/api/notes';
const ADMIN_API_BASE_URL = '/api/admin';
let socket;
let activityChart;
let currentNotes = [];
let serverStartTime = Date.now();

// Elementos del DOM
const elements = {
    // Navegación
    navItems: document.querySelectorAll('.nav-item'),
    tabContents: document.querySelectorAll('.tab-content'),
    pageTitle: document.getElementById('page-title'),
    
    // Estado del servidor
    serverStatus: document.getElementById('server-status'),
    statusIndicator: document.getElementById('status-indicator'),
    
    // Dashboard
    totalNotes: document.getElementById('total-notes'),
    activeClients: document.getElementById('active-clients'),
    uptime: document.getElementById('uptime'),
    dbStatus: document.getElementById('db-status'),
    recentActivities: document.getElementById('recent-activities'),
    
    // Notas
    notesTableBody: document.getElementById('notes-table-body'),
    noteSearch: document.getElementById('note-search'),
    sortNotes: document.getElementById('sort-notes'),
    refreshNotes: document.getElementById('refresh-notes'),
    
    // Clientes
    totalClients: document.getElementById('total-clients'),
    clientsContainer: document.getElementById('clients-container'),
    
    // Logs
    logsContent: document.getElementById('logs-content'),
    logLevel: document.getElementById('log-level'),
    logSearch: document.getElementById('log-search'),
    clearLogs: document.getElementById('clear-logs'),
    exportLogs: document.getElementById('export-logs'),
    
    // Modal
    editModal: document.getElementById('edit-modal'),
    editTitle: document.getElementById('edit-title'),
    editContent: document.getElementById('edit-content'),
    saveEdit: document.getElementById('save-edit'),
    cancelEdit: document.getElementById('cancel-edit'),
    closeModal: document.querySelector('.close')
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    setupEventListeners();
    connectWebSocket();
    loadDashboardData();
    startUptimeCounter();
});

// Inicialización del panel
function initializeAdmin() {
    console.log('Inicializando panel de administración...');
    
    // Configurar Chart.js
    const ctx = document.getElementById('activity-canvas');
    if (ctx) {
        activityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Actividad',
                    data: [],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });
    
    // Búsqueda de notas
    if (elements.noteSearch) {
        elements.noteSearch.addEventListener('input', filterNotes);
    }
    if (elements.sortNotes) {
        elements.sortNotes.addEventListener('change', sortNotes);
    }
    if (elements.refreshNotes) {
        elements.refreshNotes.addEventListener('click', loadNotes);
    }
    
    // Logs
    if (elements.logLevel) {
        elements.logLevel.addEventListener('change', filterLogs);
    }
    if (elements.logSearch) {
        elements.logSearch.addEventListener('input', filterLogs);
    }
    if (elements.clearLogs) {
        elements.clearLogs.addEventListener('click', clearLogs);
    }
    if (elements.exportLogs) {
        elements.exportLogs.addEventListener('click', exportLogs);
    }
    
    // Modal
    if (elements.closeModal) {
        elements.closeModal.addEventListener('click', closeEditModal);
    }
    if (elements.cancelEdit) {
        elements.cancelEdit.addEventListener('click', closeEditModal);
    }
    if (elements.saveEdit) {
        elements.saveEdit.addEventListener('click', saveNoteEdit);
    }
    
    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target === elements.editModal) {
            closeEditModal();
        }
    });
}

// Conectar WebSocket
function connectWebSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Conectado al servidor');
        updateServerStatus(true);
        socket.emit('admin-join');
    });
    
    socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
        updateServerStatus(false);
    });
    
    // Escuchar eventos de notas
    socket.on('note-created', (note) => {
        addActivity('create', `Nueva nota creada: ${note.title}`);
        loadDashboardData();
        if (getCurrentTab() === 'notes') {
            loadNotes();
        }
    });
    
    socket.on('note-updated', (note) => {
        addActivity('update', `Nota actualizada: ${note.title}`);
        loadDashboardData();
        if (getCurrentTab() === 'notes') {
            loadNotes();
        }
    });
    
    socket.on('note-deleted', (noteId) => {
        addActivity('delete', `Nota eliminada: ${noteId}`);
        loadDashboardData();
        if (getCurrentTab() === 'notes') {
            loadNotes();
        }
    });
    
    // Escuchar eventos de clientes
    socket.on('client-connected', (client) => {
        addActivity('info', `Cliente conectado: ${client.id}`);
        updateClientsCount();
        if (getCurrentTab() === 'clients') {
            loadClients();
        }
    });
    
    socket.on('client-disconnected', (clientId) => {
        addActivity('info', `Cliente desconectado: ${clientId}`);
        updateClientsCount();
        if (getCurrentTab() === 'clients') {
            loadClients();
        }
    });
    
    // Escuchar logs del servidor
    socket.on('server-log', (log) => {
        addLogEntry(log);
    });
    
    // Escuchar actualizaciones de estadísticas
    socket.on('stats-update', (stats) => {
        updateDashboardStats(stats);
    });
    
    // Escuchar actualizaciones de clientes
    socket.on('clients-update', (clients) => {
        updateClientsDisplay(clients);
    });
    
    // Escuchar actualizaciones de logs
    socket.on('logs-update', (logs) => {
        updateLogsDisplay(logs);
    });
}

// Cambiar entre tabs
function switchTab(tabName) {
    // Actualizar navegación
    elements.navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tabName) {
            item.classList.add('active');
        }
    });
    
    // Actualizar contenido
    elements.tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName) {
            content.classList.add('active');
        }
    });
    
    // Actualizar título
    const titles = {
        dashboard: 'Dashboard',
        notes: 'Gestión de Notas',
        clients: 'Clientes Conectados',
        logs: 'Logs del Servidor'
    };
    elements.pageTitle.textContent = titles[tabName];
    
    // Cargar datos específicos del tab
    switch(tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'notes':
            loadNotes();
            break;
        case 'clients':
            loadClients();
            break;
        case 'logs':
            loadLogs();
            break;
    }
}

// Obtener tab actual
function getCurrentTab() {
    const activeTab = document.querySelector('.nav-item.active');
    return activeTab ? activeTab.dataset.tab : 'dashboard';
}

// Actualizar estado del servidor
function updateServerStatus(connected) {
    if (elements.serverStatus) {
        elements.serverStatus.textContent = connected ? 'Conectado' : 'Desconectado';
    }
    if (elements.statusIndicator) {
        elements.statusIndicator.classList.toggle('connected', connected);
    }
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        // Cargar estadísticas desde la API de admin
        const statsResponse = await fetch(`${ADMIN_API_BASE_URL}/stats`);
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            updateDashboardStats(stats);
        } else {
            // Fallback: cargar desde la API de notas
            const response = await fetch(API_BASE_URL);
            const notes = await response.json();
            elements.totalNotes.textContent = notes.length;
        }
        
        // Cargar actividad reciente
        const activityResponse = await fetch(`${ADMIN_API_BASE_URL}/activity`);
        if (activityResponse.ok) {
            const activities = await activityResponse.json();
            updateRecentActivities(activities);
        }
        
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        if (elements.totalNotes) {
            elements.totalNotes.textContent = 'Error';
        }
    }
}

// Actualizar estadísticas del dashboard
function updateDashboardStats(stats) {
    if (elements.totalNotes) {
        elements.totalNotes.textContent = stats.totalNotes || 0;
    }
    if (elements.activeClients) {
        elements.activeClients.textContent = stats.connectedClients || 0;
    }
    if (elements.dbStatus) {
        elements.dbStatus.textContent = stats.dbStatus?.connected ? 'Conectado' : 'Desconectado';
    }
    
    // Actualizar gráfico si hay datos de actividad
    if (stats.activityData) {
        updateActivityChart(stats.activityData);
    }
}

// Actualizar actividades recientes
function updateRecentActivities(activities) {
    if (!elements.recentActivities) return;
    
    elements.recentActivities.innerHTML = activities.slice(0, 10).map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.type === 'create' ? 'plus' : activity.type === 'update' ? 'edit' : 'trash'}"></i>
            </div>
            <div class="activity-details">
                <h4>${activity.message}</h4>
                <p>${formatTime(activity.timestamp)}</p>
            </div>
        </div>
    `).join('');
}

// Actualizar gráfico de actividad
function updateActivityChart(activityData) {
    if (!activityChart) return;
    
    // Agrupar datos por fecha
    const data = {};
    activityData.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        data[date] = (data[date] || 0) + 1;
    });
    
    const labels = Object.keys(data);
    const values = Object.values(data);
    
    activityChart.data.labels = labels;
    activityChart.data.datasets[0].data = values;
    activityChart.update();
}

// Contador de tiempo activo
function startUptimeCounter() {
    setInterval(() => {
        const uptime = Date.now() - serverStartTime;
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
        
        if (elements.uptime) {
            elements.uptime.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Cargar notas
async function loadNotes() {
    try {
        const response = await fetch(API_BASE_URL);
        currentNotes = await response.json();
        
        renderNotesTable(currentNotes);
    } catch (error) {
        console.error('Error cargando notas:', error);
        if (elements.notesTableBody) {
            elements.notesTableBody.innerHTML = '<tr><td colspan="5">Error cargando notas</td></tr>';
        }
    }
}

// Renderizar tabla de notas
function renderNotesTable(notes) {
    if (!elements.notesTableBody) return;
    
    if (notes.length === 0) {
        elements.notesTableBody.innerHTML = '<tr><td colspan="5">No hay notas disponibles</td></tr>';
        return;
    }
    
    elements.notesTableBody.innerHTML = notes.map(note => `
        <tr>
            <td>${note.id}</td>
            <td>${note.title || 'Sin título'}</td>
            <td class="note-content">${note.content || 'Sin contenido'}</td>
            <td>${formatDate(note.createdAt || Date.now())}</td>
            <td class="note-actions">
                <button class="action-btn edit-btn" onclick="editNote('${note.id}')">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="action-btn delete-btn" onclick="deleteNote('${note.id}')">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </td>
        </tr>
    `).join('');
}

// Filtrar notas
function filterNotes() {
    if (!elements.noteSearch || !currentNotes) return;
    
    const searchTerm = elements.noteSearch.value.toLowerCase();
    const filteredNotes = currentNotes.filter(note => 
        note.title?.toLowerCase().includes(searchTerm) ||
        note.content?.toLowerCase().includes(searchTerm)
    );
    renderNotesTable(filteredNotes);
}

// Ordenar notas
function sortNotes() {
    if (!elements.sortNotes || !currentNotes) return;
    
    const sortBy = elements.sortNotes.value;
    let sortedNotes = [...currentNotes];
    
    switch(sortBy) {
        case 'newest':
            sortedNotes.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
        case 'oldest':
            sortedNotes.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            break;
        case 'title':
            sortedNotes.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
            break;
    }
    
    renderNotesTable(sortedNotes);
}

// Editar nota
function editNote(noteId) {
    const note = currentNotes.find(n => n.id === noteId);
    if (note && elements.editModal) {
        elements.editTitle.value = note.title || '';
        elements.editContent.value = note.content || '';
        elements.editModal.style.display = 'block';
        elements.editModal.dataset.noteId = noteId;
    }
}

// Guardar edición de nota
async function saveNoteEdit() {
    const noteId = elements.editModal.dataset.noteId;
    const title = elements.editTitle.value;
    const content = elements.editContent.value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/${noteId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, content })
        });
        
        if (response.ok) {
            closeEditModal();
            loadNotes();
            addActivity('update', `Nota actualizada: ${title}`);
        } else {
            alert('Error al actualizar la nota');
        }
    } catch (error) {
        console.error('Error actualizando nota:', error);
        alert('Error al actualizar la nota');
    }
}

// Cerrar modal de edición
function closeEditModal() {
    if (elements.editModal) {
        elements.editModal.style.display = 'none';
        elements.editTitle.value = '';
        elements.editContent.value = '';
        delete elements.editModal.dataset.noteId;
    }
}

// Eliminar nota
async function deleteNote(noteId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/${noteId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadNotes();
            addActivity('delete', `Nota eliminada: ${noteId}`);
        } else {
            alert('Error al eliminar la nota');
        }
    } catch (error) {
        console.error('Error eliminando nota:', error);
        alert('Error al eliminar la nota');
    }
}

// Cargar clientes
async function loadClients() {
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/clients`);
        if (response.ok) {
            const clients = await response.json();
            updateClientsDisplay(clients);
        } else {
            // Fallback: simular datos
            const clients = [
                { id: 'client-1', name: 'Usuario 1', status: 'online', lastActivity: Date.now() },
                { id: 'client-2', name: 'Usuario 2', status: 'online', lastActivity: Date.now() - 300000 }
            ];
            updateClientsDisplay(clients);
        }
    } catch (error) {
        console.error('Error cargando clientes:', error);
        updateClientsDisplay([]);
    }
}

// Actualizar display de clientes
function updateClientsDisplay(clients) {
    if (elements.totalClients) {
        elements.totalClients.textContent = `${clients.length} clientes conectados`;
    }
    if (elements.clientsContainer) {
        elements.clientsContainer.innerHTML = clients.map(client => `
            <div class="client-card">
                <div class="client-info">
                    <div class="client-avatar">
                        ${client.name ? client.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div class="client-details">
                        <h4>${client.name || 'Usuario'}</h4>
                        <p>ID: ${client.id}</p>
                    </div>
                </div>
                <div class="client-status">
                    <span class="status-badge ${client.status}">
                        ${client.status === 'online' ? 'En línea' : 'Desconectado'}
                    </span>
                    <span>Última actividad: ${formatTime(client.lastActivity)}</span>
                </div>
            </div>
        `).join('');
    }
}

// Actualizar contador de clientes
function updateClientsCount() {
    // En un caso real, esto vendría del servidor
    const count = Math.floor(Math.random() * 10) + 1;
    if (elements.activeClients) {
        elements.activeClients.textContent = count;
    }
    if (elements.totalClients) {
        elements.totalClients.textContent = `${count} clientes conectados`;
    }
}

// Cargar logs
async function loadLogs() {
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/logs`);
        if (response.ok) {
            const logs = await response.json();
            updateLogsDisplay(logs);
        } else {
            // Fallback: simular logs
            const logs = [
                { timestamp: Date.now() - 1000, level: 'info', message: 'Servidor iniciado correctamente' },
                { timestamp: Date.now() - 5000, level: 'info', message: 'Cliente conectado: client-1' }
            ];
            updateLogsDisplay(logs);
        }
    } catch (error) {
        console.error('Error cargando logs:', error);
        updateLogsDisplay([]);
    }
}

// Actualizar display de logs
function updateLogsDisplay(logs) {
    if (elements.logsContent) {
        elements.logsContent.innerHTML = logs.map(log => `
            <div class="log-entry">
                <span class="log-timestamp">${formatTime(log.timestamp)}</span>
                <span class="log-level ${log.level}">${log.level}</span>
                <span class="log-message">${log.message}</span>
            </div>
        `).join('');
    }
}

// Filtrar logs
function filterLogs() {
    // Implementar filtrado de logs
    console.log('Filtrando logs...');
}

// Limpiar logs
async function clearLogs() {
    if (!confirm('¿Estás seguro de que quieres limpiar todos los logs?')) {
        return;
    }
    
    try {
        const response = await fetch(`${ADMIN_API_BASE_URL}/logs`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            if (elements.logsContent) {
                elements.logsContent.innerHTML = '<p>Logs limpiados</p>';
            }
        } else {
            alert('Error al limpiar logs');
        }
    } catch (error) {
        console.error('Error limpiando logs:', error);
        alert('Error al limpiar logs');
    }
}

// Exportar logs
function exportLogs() {
    if (!elements.logsContent) return;
    
    const logs = elements.logsContent.innerHTML;
    const blob = new Blob([logs], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

// Agregar actividad
function addActivity(type, message) {
    if (!elements.recentActivities) return;
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const iconClass = type === 'create' ? 'create' : type === 'update' ? 'update' : 'delete';
    
    activityItem.innerHTML = `
        <div class="activity-icon ${iconClass}">
            <i class="fas fa-${type === 'create' ? 'plus' : type === 'update' ? 'edit' : 'trash'}"></i>
        </div>
        <div class="activity-details">
            <h4>${message}</h4>
            <p>${formatTime(Date.now())}</p>
        </div>
    `;
    
    elements.recentActivities.insertBefore(activityItem, elements.recentActivities.firstChild);
    
    // Limitar a 10 actividades
    const activities = elements.recentActivities.querySelectorAll('.activity-item');
    if (activities.length > 10) {
        activities[activities.length - 1].remove();
    }
}

// Agregar entrada de log
function addLogEntry(log) {
    if (!elements.logsContent) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    logEntry.innerHTML = `
        <span class="log-timestamp">${formatTime(log.timestamp)}</span>
        <span class="log-level ${log.level}">${log.level}</span>
        <span class="log-message">${log.message}</span>
    `;
    
    elements.logsContent.insertBefore(logEntry, elements.logsContent.firstChild);
    
    // Limitar a 100 logs
    const logs = elements.logsContent.querySelectorAll('.log-entry');
    if (logs.length > 100) {
        logs[logs.length - 1].remove();
    }
}

// Utilidades
function formatDate(timestamp) {
    return new Date(timestamp).toLocaleString('es-ES');
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('es-ES');
}

// Exponer funciones globalmente para los botones
window.editNote = editNote;
window.deleteNote = deleteNote; 