// DASHBOARD - MAPA Y TIEMPO REAL

let session = null;
let currentRoute = null;
let deliveries = [];
let documents = [];
let reports = [];
let map = null;
let routeLayer = null;
let currentLocationMarker = null;
let watchId = null;

document.addEventListener('DOMContentLoaded', function() {
    session = checkSession();
    if (!session) return;
    if (session.role === 'admin' || session.role === 'manager') {
        window.location.href = 'admin.html';
        return;
    }
    
    initUI();
    loadData();
    setupNavigation();
    setupModals();
    setupForms();
    setupRealtime();
    updateTime();
    setInterval(updateTime, 1000);
    setInterval(refreshData, 30000); // Actualizar cada 30 segundos
});

function initUI() {
    document.getElementById('userName').textContent = session.name;
    document.getElementById('userRole').textContent = formatRole(session.role);
    document.getElementById('userAvatar').textContent = session.name.charAt(0).toUpperCase();
    
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const close = document.getElementById('sidebarClose');
    
    if (toggle) toggle.addEventListener('click', () => sidebar.classList.add('active'));
    if (close) close.addEventListener('click', () => sidebar.classList.remove('active'));
    
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
}

function formatRole(role) {
    const r = { admin: 'Admin', manager: 'Gerente', supervisor: 'Supervisor', operator: 'Operador' };
    return r[role] || role;
}

function updateTime() {
    document.getElementById('currentTime').textContent = new Date().toLocaleString('es-MX');
    document.getElementById('lastUpdate').textContent = 'Actualizado: ' + new Date().toLocaleTimeString('es-MX');
}

function loadData() {
    loadUserRoute();
    loadDeliveries();
    loadDocuments();
    loadReports();
}

function loadUserRoute() {
    const savedRoutes = localStorage.getItem('supply_routes');
    const allRoutes = savedRoutes ? JSON.parse(savedRoutes) : [];
    
    // Buscar ruta asignada al operador actual
    currentRoute = allRoutes.find(r => r.assignedTo === session.id && r.status !== 'completed');
    
    if (!currentRoute) {
        // Crear ruta de ejemplo si no tiene
        currentRoute = {
            id: 'R' + Date.now(),
            origin: 'Lima',
            destination: 'Huacho',
            distance: 148,
            eta: '14:30',
            status: 'pending',
            progress: 0,
            assignedTo: session.id,
            operatorName: session.name,
            stops: [
                { address: 'Av. Argentina 123', client: 'Cliente A', completed: false },
                { address: 'Av. Grau 456', client: 'Cliente B', completed: false }
            ],
            currentLocation: { lat: -12.0464, lng: -77.0428 }
        };
    }
    
    renderRouteInfo();
    renderHomeRoute();
}

function renderRouteInfo() {
    if (!currentRoute) return;
    
    document.getElementById('routeName').textContent = `Ruta ${currentRoute.origin} - ${currentRoute.destination}`;
    document.getElementById('routeStatus').textContent = getStatusText(currentRoute.status);
    document.getElementById('routeOrigin').textContent = currentRoute.origin;
    document.getElementById('routeDestination').textContent = currentRoute.destination;
    document.getElementById('routeDistance').textContent = currentRoute.distance + ' km';
    document.getElementById('routeETA').textContent = currentRoute.eta || '--:--';
    document.getElementById('routeProgress').textContent = currentRoute.progress || 0;
    document.getElementById('progressFill').style.width = (currentRoute.progress || 0) + '%';
    
    // Habilitar/deshabilitar botones
    const startBtn = document.getElementById('startRouteBtn');
    const completeBtn = document.getElementById('completeRouteBtn');
    
    if (currentRoute.status === 'pending') {
        startBtn.disabled = false;
        completeBtn.disabled = true;
    } else if (currentRoute.status === 'in-progress') {
        startBtn.disabled = true;
        completeBtn.disabled = false;
    } else {
        startBtn.disabled = true;
        completeBtn.disabled = true;
    }
    
    // Renderizar paradas
    const stopsList = document.getElementById('stopsList');
    if (stopsList && currentRoute.stops) {
        stopsList.innerHTML = currentRoute.stops.map((stop, index) => `
            <div class="stop-card ${stop.completed ? 'completed' : ''}">
                <span class="stop-number">${index + 1}</span>
                <div class="stop-info">
                    <strong>${stop.client}</strong>
                    <span>${stop.address}</span>
                </div>
                ${!stop.completed ? `<button class="btn-small" onclick="completeStop(${index})">Completar</button>` : 
                    '<span class="badge-success">Completado</span>'}
            </div>
        `).join('');
    }
}

function getStatusText(status) {
    const s = { pending: 'Pendiente', 'in-progress': 'En Progreso', completed: 'Completado' };
    return s[status] || status;
}

function renderHomeRoute() {
    const container = document.getElementById('currentRouteInfo');
    if (!container) return;
    
    if (!currentRoute) {
        container.innerHTML = '<p class="no-route">No tienes ruta asignada</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="mini-route">
            <div class="route-path">
                <span>${currentRoute.origin}</span>
                <span>→</span>
                <span>${currentRoute.destination}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${currentRoute.progress || 0}%"></div>
            </div>
            <div class="route-meta">
                <span>${currentRoute.distance} km</span>
                <span>${currentRoute.progress || 0}% completado</span>
            </div>
        </div>
    `;
}

function initMap() {
    if (map) return;
    
    const defaultLoc = currentRoute?.currentLocation || { lat: -12.0464, lng: -77.0428 };
    map = L.map('routeMap').setView([defaultLoc.lat, defaultLoc.lng], 8);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    
    drawRoute();
}

function drawRoute() {
    if (!map || !currentRoute) return;
    
    // Limpiar capas anteriores
    if (routeLayer) map.removeLayer(routeLayer);
    if (currentLocationMarker) map.removeLayer(currentLocationMarker);
    
    // Definir puntos de la ruta
    const points = [
        currentRoute.currentLocation || { lat: -12.0464, lng: -77.0428 },
        { lat: -11.1085, lng: -77.6103 } // Huacho (ejemplo)
    ];
    
    // Dibujar linea de ruta
    routeLayer = L.polyline(points, { color: '#e74c3c', weight: 4 }).addTo(map);
    
    // Marcador de posicion actual
    currentLocationMarker = L.marker([points[0].lat, points[0].lng], {
        title: 'Tu ubicacion actual'
    }).addTo(map).bindPopup('Estas aqui').openPopup();
    
    // Marcador de destino
    L.marker([points[1].lat, points[1].lng], {
        title: 'Destino: ' + currentRoute.destination
    }).addTo(map).bindPopup('Destino: ' + currentRoute.destination);
    
    // Ajustar vista
    map.fitBounds(routeLayer.getBounds());
}

function startRoute() {
    if (!currentRoute) return;
    
    currentRoute.status = 'in-progress';
    currentRoute.startTime = new Date().toISOString();
    saveRoutes();
    
    renderRouteInfo();
    initMap();
    
    // Iniciar seguimiento GPS
    startLocationTracking();
}

function completeRoute() {
    if (!currentRoute) return;
    
    if (confirm('Confirmar que has completado la ruta?')) {
        currentRoute.status = 'completed';
        currentRoute.progress = 100;
        currentRoute.completedTime = new Date().toISOString();
        saveRoutes();
        
        renderRouteInfo();
        stopLocationTracking();
        
        alert('Ruta completada!');
    }
}

function startLocationTracking() {
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            position => {
                const newLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                updateCurrentLocation(newLoc);
            },
            error => console.error('Error GPS:', error),
            { enableHighAccuracy: true, maximumAge: 10000 }
        );
    }
}

function stopLocationTracking() {
    if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
}

function updateCurrentLocation(location) {
    if (!currentRoute) return;
    
    currentRoute.currentLocation = location;
    
    // Calcular progreso basado en distancia
    if (currentRoute.status === 'in-progress') {
        // Simulacion de progreso
        currentRoute.progress = Math.min(currentRoute.progress + 2, 99);
    }
    
    saveRoutes();
    
    if (map && currentLocationMarker) {
        currentLocationMarker.setLatLng([location.lat, location.lng]);
    }
    
    renderRouteInfo();
    renderHomeRoute();
    
    document.getElementById('syncStatus').textContent = 'Sincronizado';
    document.getElementById('lastUpdate').textContent = 'Actualizado: ' + new Date().toLocaleTimeString('es-MX');
}

function showLocationPicker() {
    const modal = document.getElementById('locationModal');
    modal.classList.add('active');
    
    setTimeout(() => {
        const pickerMap = L.map('locationPickerMap').setView([
            currentRoute?.currentLocation?.lat || -12.0464,
            currentRoute?.currentLocation?.lng || -77.0428
        ], 13);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(pickerMap);
        
        let marker = L.marker([
            currentRoute?.currentLocation?.lat || -12.0464,
            currentRoute?.currentLocation?.lng || -77.0428
        ], { draggable: true }).addTo(pickerMap);
        
        document.getElementById('confirmLocation').onclick = () => {
            const pos = marker.getLatLng();
            updateCurrentLocation({ lat: pos.lat, lng: pos.lng });
            modal.classList.remove('active');
            if (map) drawRoute();
        };
    }, 100);
}

function completeStop(index) {
    if (!currentRoute?.stops) return;
    
    currentRoute.stops[index].completed = true;
    currentRoute.stops[index].completedTime = new Date().toISOString();
    
    // Calcular progreso
    const completed = currentRoute.stops.filter(s => s.completed).length;
    currentRoute.progress = Math.round((completed / currentRoute.stops.length) * 100);
    
    saveRoutes();
    renderRouteInfo();
    renderHomeRoute();
    loadDeliveries();
}

function loadDeliveries() {
    deliveries = [];
    if (currentRoute?.stops) {
        deliveries = currentRoute.stops.map((stop, index) => ({
            id: index,
            client: stop.client,
            address: stop.address,
            status: stop.completed ? 'completed' : 'pending'
        }));
    }
    
    renderDeliveries();
    updateStats();
}

function renderDeliveries(filter = 'all') {
    const container = document.getElementById('deliveriesFull');
    if (!container) return;
    
    let filtered = deliveries;
    if (filter === 'pending') filtered = deliveries.filter(d => !d.completed);
    if (filter === 'completed') filtered = deliveries.filter(d => d.completed);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">No hay entregas</p>';
        return;
    }
    
    container.innerHTML = filtered.map(d => `
        <div class="delivery-card ${d.status}" onclick="showDeliveryDetail(${d.id})">
            <div class="delivery-header">
                <span class="delivery-client">${d.client}</span>
                <span class="status ${d.status}">${d.status === 'completed' ? 'Completado' : 'Pendiente'}</span>
            </div>
            <div class="delivery-address">${d.address}</div>
        </div>
    `).join('');
}

function showDeliveryDetail(id) {
    const delivery = deliveries[id];
    if (!delivery) return;
    
    const modal = document.getElementById('deliveryDetailModal');
    const detail = document.getElementById('deliveryDetail');
    
    detail.innerHTML = `
        <p><strong>Cliente:</strong> ${delivery.client}</p>
        <p><strong>Direccion:</strong> ${delivery.address}</p>
        <p><strong>Estado:</strong> ${delivery.status === 'completed' ? 'Completado' : 'Pendiente'}</p>
    `;
    
    document.getElementById('completeDeliveryBtn').onclick = () => {
        completeStop(id);
        modal.classList.remove('active');
    };
    
    modal.classList.add('active');
}

function updateStats() {
    const total = deliveries.length;
    const completed = deliveries.filter(d => d.status === 'completed').length;
    const pending = total - completed;
    
    document.getElementById('todayDeliveries').textContent = total;
    document.getElementById('pendingDeliveries').textContent = pending;
    document.getElementById('completedDeliveries').textContent = completed;
    document.getElementById('efficiency').textContent = total > 0 ? Math.round((completed / total) * 100) + '%' : '0%';
}

function loadDocuments() {
    const saved = localStorage.getItem('supply_documents');
    documents = saved ? JSON.parse(saved) : [];
    renderDocuments();
}

function renderDocuments() {
    const container = document.getElementById('documentsGrid');
    const filter = document.getElementById('docTypeFilter')?.value || 'all';
    
    if (!container) return;
    
    let filtered = filter === 'all' ? documents : documents.filter(d => d.type === filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">No hay documentos</p>';
        return;
    }
    
    container.innerHTML = filtered.map(d => `
        <div class="doc-card">
            <div class="doc-icon">${getDocIcon(d.type)}</div>
            <div class="doc-info">
                <span class="doc-name">${d.name}</span>
                <span class="doc-type">${d.type}</span>
                <span class="doc-date">${d.date}</span>
            </div>
        </div>
    `).join('');
}

function getDocIcon(type) {
    const i = { factura: '📄', guia: '📋', foto_carga: '📷', foto_entrega: '📸' };
    return i[type] || '📎';
}

function loadReports() {
    const saved = localStorage.getItem('supply_reports');
    reports = saved ? JSON.parse(saved) : [];
    renderReports();
}

function renderReports() {
    const container = document.getElementById('reportsList');
    const filter = document.getElementById('reportFilter')?.value || 'all';
    
    if (!container) return;
    
    const userReports = reports.filter(r => r.createdBy === session.id);
    let filtered = filter === 'all' ? userReports : userReports.filter(r => r.status === filter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<p class="no-data">No hay reportes</p>';
        return;
    }
    
    container.innerHTML = filtered.map(r => `
        <div class="report-card ${r.status}">
            <div class="report-header">
                <span class="report-id">${r.id}</span>
                <span class="report-status ${r.status}">${getReportStatus(r.status)}</span>
            </div>
            <p><strong>Tipo:</strong> ${r.type}</p>
            <p>${r.description}</p>
            <small>${r.date}</small>
            ${r.response ? `<div class="report-response">Respuesta: ${r.response}</div>` : ''}
        </div>
    `).join('');
}

function getReportStatus(status) {
    const s = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };
    return s[status] || status;
}

function saveRoutes() {
    const saved = localStorage.getItem('supply_routes');
    let routes = saved ? JSON.parse(saved) : [];
    
    const index = routes.findIndex(r => r.id === currentRoute.id);
    if (index !== -1) {
        routes[index] = currentRoute;
    } else {
        routes.push(currentRoute);
    }
    
    localStorage.setItem('supply_routes', JSON.stringify(routes));
}

function refreshData() {
    document.getElementById('syncStatus').textContent = 'Sincronizando...';
    
    const saved = localStorage.getItem('supply_routes');
    if (saved) {
        const routes = JSON.parse(saved);
        const updated = routes.find(r => r.id === currentRoute?.id);
        if (updated) currentRoute = updated;
    }
    
    loadDeliveries();
    renderRouteInfo();
    renderHomeRoute();
    if (map) drawRoute();
    
    document.getElementById('syncStatus').textContent = 'Sincronizado';
    document.getElementById('lastUpdate').textContent = 'Actualizado: ' + new Date().toLocaleTimeString('es-MX');
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const page = this.dataset.page;
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById(page).classList.add('active');
            
            document.getElementById('pageTitle').textContent = this.textContent;
            document.getElementById('sidebar').classList.remove('active');
            
            if (page === 'route' && !map) {
                setTimeout(initMap, 100);
            }
        });
    });
    
    // Filtros de entregas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            renderDeliveries(this.dataset.filter);
        });
    });
}

function setupModals() {
    // Botones
    document.getElementById('startRouteBtn').addEventListener('click', startRoute);
    document.getElementById('completeRouteBtn').addEventListener('click', completeRoute);
    document.getElementById('updateLocationBtn').addEventListener('click', showLocationPicker);
    document.getElementById('uploadDocBtn').addEventListener('click', () => document.getElementById('uploadModal').classList.add('active'));
    document.getElementById('takePhotoBtn').addEventListener('click', takePhoto);
    document.getElementById('uploadFileBtn').addEventListener('click', () => document.getElementById('uploadModal').classList.add('active'));
    document.getElementById('newReportBtn').addEventListener('click', () => document.getElementById('reportModal').classList.add('active'));
    
    // Cerrar modales
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').classList.remove('active');
        });
    });
    
    // Filtros
    document.getElementById('docTypeFilter')?.addEventListener('change', renderDocuments);
    document.getElementById('reportFilter')?.addEventListener('change', renderReports);
}

function setupForms() {
    document.getElementById('uploadForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const file = document.getElementById('docFile').files[0];
        if (!file) return;
        
        const doc = {
            id: Date.now(),
            name: file.name,
            type: document.getElementById('docType').value,
            description: document.getElementById('docDesc').value,
            date: new Date().toLocaleDateString('es-MX'),
            createdBy: session.id
        };
        
        documents.push(doc);
        localStorage.setItem('supply_documents', JSON.stringify(documents));
        renderDocuments();
        
        this.reset();
        document.getElementById('uploadModal').classList.remove('active');
    });
    
    document.getElementById('reportForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const report = {
            id: 'REP' + Date.now(),
            type: document.getElementById('reportType').value,
            description: document.getElementById('reportDesc').value,
            status: 'pending',
            date: new Date().toLocaleDateString('es-MX'),
            createdBy: session.id,
            createdByName: session.name
        };
        
        reports.push(report);
        localStorage.setItem('supply_reports', JSON.stringify(reports));
        renderReports();
        
        this.reset();
        document.getElementById('reportModal').classList.remove('active');
    });
}

function takePhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            const doc = {
                id: Date.now(),
                name: 'Foto_' + new Date().toLocaleTimeString().replace(/:/g, '-') + '.jpg',
                type: 'foto_carga',
                date: new Date().toLocaleDateString('es-MX'),
                createdBy: session.id
            };
            documents.push(doc);
            localStorage.setItem('supply_documents', JSON.stringify(documents));
            renderDocuments();
        }
    };
    input.click();
}

function setupRealtime() {
    // Verificar si hay ruta en progreso para iniciar tracking
    if (currentRoute?.status === 'in-progress') {
        startLocationTracking();
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', logout);

window.showDeliveryDetail = showDeliveryDetail;
window.completeStop = completeStop;