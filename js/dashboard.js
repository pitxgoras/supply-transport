// DASHBOARD - RUTAS, DOCUMENTOS Y REPORTES

let currentSession = null;
let routes = [];
let documents = [];
let reports = [];

document.addEventListener('DOMContentLoaded', function() {
    currentSession = checkSession();
    
    if (!currentSession) {
        window.location.href = 'login.html';
        return;
    }
    
    if (currentSession.role === 'admin' || currentSession.role === 'manager') {
        window.location.href = 'admin.html';
        return;
    }
    
    displayUserInfo(currentSession);
    initializeDashboard();
    setupNavigation();
    setupMobileSidebar();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Cargar datos
    loadRoutes();
    loadDocuments();
    loadReports();
    
    // Setup formularios
    setupUploadForm();
    setupReportForm();
    setupFileInput();
});

function initializeDashboard() {
    console.log('Dashboard inicializado para:', currentSession.name);
}

function setupMobileSidebar() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    const main = document.getElementById('mainContent');
    
    if (toggle) {
        toggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
            main.classList.toggle('sidebar-active');
        });
    }
}

function loadRoutes() {
    // Cargar rutas guardadas o usar datos de ejemplo
    const savedRoutes = localStorage.getItem('supply_routes');
    if (savedRoutes) {
        routes = JSON.parse(savedRoutes);
    } else {
        routes = [
            { id: 'R001', origin: 'Lima', destination: 'Huacho', status: 'in-progress', progress: 65, eta: '14:30', distance: '148 km', assignedTo: currentSession.name },
            { id: 'R002', origin: 'Lima', destination: 'Chiclayo', status: 'pending', progress: 0, eta: '18:00', distance: '770 km', assignedTo: currentSession.name },
            { id: 'R003', origin: 'Lima', destination: 'Piura', status: 'completed', progress: 100, eta: '11:45', distance: '980 km', assignedTo: currentSession.name },
            { id: 'R004', origin: 'Arequipa', destination: 'Tacna', status: 'pending', progress: 0, eta: '09:30', distance: '370 km', assignedTo: 'Carlos Ruiz' }
        ];
        localStorage.setItem('supply_routes', JSON.stringify(routes));
    }
    
    renderRoutesList();
}

function renderRoutesList() {
    const container = document.getElementById('routesListContainer');
    if (!container) return;
    
    // Filtrar rutas del empleado actual o todas si es supervisor
    let displayRoutes = routes;
    if (currentSession.role === 'operator') {
        displayRoutes = routes.filter(r => r.assignedTo === currentSession.name);
    }
    
    container.innerHTML = displayRoutes.map(route => `
        <div class="route-card ${route.status}">
            <div class="route-card-header">
                <span class="route-id">Ruta ${route.id}</span>
                <span class="route-status-badge ${route.status}">${getRouteStatusText(route.status)}</span>
            </div>
            <div class="route-card-body">
                <div class="route-locations">
                    <span class="origin">${route.origin}</span>
                    <span class="arrow">→</span>
                    <span class="destination">${route.destination}</span>
                </div>
                <div class="route-details">
                    <span>ETA: ${route.eta}</span>
                    <span>Distancia: ${route.distance}</span>
                    ${route.assignedTo ? `<span>Asignado: ${route.assignedTo}</span>` : ''}
                </div>
                ${route.status === 'in-progress' ? `
                    <div class="progress-container">
                        <div class="progress-label">Progreso: ${route.progress}%</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${route.progress}%"></div>
                        </div>
                    </div>
                ` : ''}
            </div>
            ${route.status === 'in-progress' && route.assignedTo === currentSession.name ? `
                <div class="route-card-footer">
                    <button class="btn-small" onclick="updateRouteProgress('${route.id}')">Actualizar Progreso</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function getRouteStatusText(status) {
    const statuses = {
        'pending': 'Pendiente',
        'in-progress': 'En Progreso',
        'completed': 'Completado'
    };
    return statuses[status] || status;
}

function updateRouteProgress(routeId) {
    const route = routes.find(r => r.id === routeId);
    if (!route) return;
    
    const newProgress = prompt('Ingrese el porcentaje de progreso (0-100):', route.progress);
    if (newProgress !== null) {
        const progress = parseInt(newProgress);
        if (progress >= 0 && progress <= 100) {
            route.progress = progress;
            if (progress >= 100) {
                route.status = 'completed';
            }
            
            localStorage.setItem('supply_routes', JSON.stringify(routes));
            renderRoutesList();
            
            // Actualizar barra de progreso en ruta activa
            const progressBar = document.querySelector('.map-progress-bar .progress-fill');
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            alert('Progreso actualizado a ' + progress + '%');
        } else {
            alert('Porcentaje invalido. Debe ser entre 0 y 100.');
        }
    }
}

function loadDocuments() {
    const savedDocs = localStorage.getItem('supply_documents');
    documents = savedDocs ? JSON.parse(savedDocs) : [];
    renderDocumentsGrid();
}

function renderDocumentsGrid() {
    const container = document.getElementById('documentsGrid');
    if (!container) return;
    
    if (documents.length === 0) {
        container.innerHTML = '<p class="empty-message">No hay documentos cargados</p>';
        return;
    }
    
    container.innerHTML = documents.slice(0, 9).map(doc => `
        <div class="doc-card">
            <div class="doc-icon">${getDocIcon(doc.type)}</div>
            <div class="doc-info">
                <span class="doc-name">${doc.name}</span>
                <span class="doc-type">${formatDocType(doc.type)}</span>
                <span class="doc-date">${doc.date}</span>
            </div>
            ${doc.description ? `<p class="doc-desc">${doc.description}</p>` : ''}
        </div>
    `).join('');
}

function getDocIcon(type) {
    const icons = {
        'factura': '📄',
        'guia': '📋',
        'foto_carga': '📷',
        'foto_entrega': '📸',
        'foto_vehiculo': '🚛',
        'otro': '📎'
    };
    return icons[type] || '📄';
}

function formatDocType(type) {
    const types = {
        'factura': 'Factura',
        'guia': 'Guia de Envio',
        'foto_carga': 'Foto de Carga',
        'foto_entrega': 'Foto de Entrega',
        'foto_vehiculo': 'Foto de Vehiculo',
        'otro': 'Otro'
    };
    return types[type] || type;
}

function setupFileInput() {
    const fileInput = document.getElementById('fileInput');
    const fileCount = document.getElementById('fileCount');
    
    if (fileInput && fileCount) {
        fileInput.addEventListener('change', function() {
            const count = this.files.length;
            fileCount.textContent = count > 0 ? `${count} archivo(s) seleccionado(s)` : '';
        });
    }
}

function setupUploadForm() {
    const form = document.getElementById('uploadForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('fileInput');
        const docType = document.getElementById('docType').value;
        const description = document.getElementById('docDescription').value;
        
        if (fileInput.files.length === 0) {
            alert('Seleccione al menos un archivo');
            return;
        }
        
        let filesProcessed = 0;
        
        for (let file of fileInput.files) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const newDoc = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: docType,
                    description: description,
                    date: new Date().toLocaleDateString('es-MX'),
                    data: event.target.result,
                    size: file.size,
                    uploadedBy: currentSession.name
                };
                
                documents.unshift(newDoc);
                filesProcessed++;
                
                if (filesProcessed === fileInput.files.length) {
                    localStorage.setItem('supply_documents', JSON.stringify(documents));
                    renderDocumentsGrid();
                    form.reset();
                    document.getElementById('fileCount').textContent = '';
                    alert('Documentos subidos correctamente');
                }
            };
            
            if (file.type.startsWith('image/')) {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
        }
    });
}

function loadReports() {
    const savedReports = localStorage.getItem('supply_reports');
    reports = savedReports ? JSON.parse(savedReports) : [];
    
    if (reports.length === 0) {
        reports = [
            { id: 'REP001', type: 'incidencia', description: 'Trafico pesado en carretera Panamericana', status: 'approved', date: '2024-01-15', response: 'Aprobado - Se ajusta ETA', createdBy: currentSession.name },
            { id: 'REP002', type: 'retraso', description: 'Retraso por condiciones climaticas en zona norte', status: 'pending', date: '2024-01-16', response: '', createdBy: currentSession.name },
            { id: 'REP003', type: 'danos', description: 'Caja danada en esquina superior derecha', status: 'rejected', date: '2024-01-14', response: 'Rechazado - El dano ya estaba reportado anteriormente', createdBy: 'Carlos Ruiz' }
        ];
        localStorage.setItem('supply_reports', JSON.stringify(reports));
    }
    
    renderReports();
}

function renderReports() {
    const container = document.getElementById('reportsList');
    if (!container) return;
    
    const filterSelect = document.getElementById('reportStatusFilter');
    const filterValue = filterSelect ? filterSelect.value : '';
    
    let displayReports = reports;
    if (filterValue) {
        displayReports = reports.filter(r => r.status === filterValue);
    }
    
    if (displayReports.length === 0) {
        container.innerHTML = '<p class="empty-message">No hay reportes</p>';
        return;
    }
    
    container.innerHTML = displayReports.map(r => `
        <div class="report-card ${r.status}">
            <div class="report-header">
                <span class="report-id">${r.id}</span>
                <span class="report-status ${r.status}">${getReportStatusText(r.status)}</span>
            </div>
            <div class="report-body">
                <p><strong>Tipo:</strong> ${formatReportType(r.type)}</p>
                <p><strong>Fecha:</strong> ${r.date}</p>
                <p><strong>Creado por:</strong> ${r.createdBy}</p>
                <p><strong>Descripcion:</strong> ${r.description}</p>
                ${r.response ? `<p class="report-response"><strong>Respuesta:</strong> ${r.response}</p>` : ''}
            </div>
        </div>
    `).join('');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', renderReports);
    }
}

function getReportStatusText(status) {
    const statuses = {
        'pending': 'Pendiente',
        'approved': 'Realizado',
        'rejected': 'Rechazado'
    };
    return statuses[status] || status;
}

function formatReportType(type) {
    const types = {
        'incidencia': 'Incidencia en Ruta',
        'retraso': 'Retraso',
        'danos': 'Danos en Carga',
        'accidente': 'Accidente',
        'otro': 'Otro'
    };
    return types[type] || type;
}

function setupReportForm() {
    const form = document.getElementById('reportForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const newReport = {
            id: 'REP' + String(reports.length + 1).padStart(3, '0'),
            type: document.getElementById('reportType').value,
            description: document.getElementById('reportDescription').value,
            status: 'pending',
            date: new Date().toLocaleDateString('es-MX'),
            response: '',
            createdBy: currentSession.name
        };
        
        const imageInput = document.getElementById('reportImage');
        if (imageInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(event) {
                newReport.image = event.target.result;
                reports.unshift(newReport);
                localStorage.setItem('supply_reports', JSON.stringify(reports));
                renderReports();
            };
            reader.readAsDataURL(imageInput.files[0]);
        } else {
            reports.unshift(newReport);
            localStorage.setItem('supply_reports', JSON.stringify(reports));
            renderReports();
        }
        
        closeReportModal();
        alert('Reporte enviado correctamente');
    });
}

function createNewReport() {
    document.getElementById('reportModal').style.display = 'block';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    document.getElementById('reportForm').reset();
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            const pageId = this.getAttribute('data-page');
            showDashboardPage(pageId);
            
            if (window.innerWidth <= 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
        });
    });
}

function showDashboardPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.add('active');
}

function updateDateTime() {
    const dateTimeElement = document.getElementById('currentDateTime');
    if (dateTimeElement) {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        dateTimeElement.textContent = now.toLocaleDateString('es-MX', options);
    }
}

// Funciones globales
window.showDashboardPage = showDashboardPage;
window.createNewReport = createNewReport;
window.closeReportModal = closeReportModal;
window.updateRouteProgress = updateRouteProgress;