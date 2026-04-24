/* =========================================================
   DASHBOARD JS - FUNCIONAL Y CONECTADO AL ADMIN
   Sistema: Supply Transport
   ========================================================= */

/* =========================
   VARIABLES GLOBALES
   ========================= */

let session = null;
let myRoutes = [];
let documents = [];
let reports = [];
let currentViewRoute = null;
let mapInstance = null;
let pollingInterval = null;

/* =========================
   INICIO
   ========================= */

document.addEventListener('DOMContentLoaded', function () {
    session = getCurrentSession();

    if (!session) {
        window.location.href = 'login.html';
        return;
    }

    if (session.role === 'admin' || session.role === 'manager') {
        window.location.href = 'admin.html';
        return;
    }

    initUI();
    loadAllData();
    setupNavigation();
    setupTabs();
    setupModals();
    setupForms();
    setupButtons();
    startPolling();
});

/* =========================
   SESION
   ========================= */

function getCurrentSession() {
    if (typeof checkSession === 'function') {
        return checkSession();
    }

    const possibleKeys = [
        'supply_session',
        'session',
        'currentUser'
    ];

    for (const key of possibleKeys) {
        const saved = localStorage.getItem(key);

        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (error) {
                return null;
            }
        }
    }

    return null;
}

function logoutUser() {
    if (typeof logout === 'function') {
        logout();
        return;
    }

    localStorage.removeItem('supply_session');
    localStorage.removeItem('session');
    localStorage.removeItem('currentUser');

    window.location.href = 'login.html';
}

/* =========================
   UI GENERAL
   ========================= */

function initUI() {
    setText('profileName', session.name || 'Usuario');
    setText('profileRole', formatRole(session.role || 'operator'));
    setText('profileAvatar', (session.name || 'U').charAt(0).toUpperCase());
    setText('statusText', 'En linea');

    const menuBtn = document.getElementById('menuBtn');
    const sidebarClose = document.getElementById('sidebarClose');
    const overlay = document.getElementById('overlay');
    const logoutBtn = document.getElementById('logoutBtn');

    if (menuBtn) {
        menuBtn.addEventListener('click', openMenu);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeMenu);
    }

    if (overlay) {
        overlay.addEventListener('click', closeMenu);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutUser);
    }
}

function openMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (sidebar) sidebar.classList.add('active');
    if (overlay) overlay.classList.add('active');
}

function closeMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function getValue(id) {
    const element = document.getElementById(id);

    if (!element) return '';

    return element.value.trim();
}

function formatRole(role) {
    const roles = {
        admin: 'Admin',
        manager: 'Gerente',
        supervisor: 'Supervisor',
        operator: 'Operador'
    };

    return roles[role] || role;
}

function formatStatus(status) {
    const statuses = {
        pending: 'Pendiente',
        'in-progress': 'En Progreso',
        completed: 'Completada',
        cancelled: 'Cancelada',
        approved: 'Aprobado',
        rejected: 'Rechazado'
    };

    return statuses[status] || status;
}

function escapeHTML(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* =========================
   CARGA GENERAL
   ========================= */

function loadAllData() {
    loadMyRoutes();
    loadDocuments();
    loadReports();
    updateStats();
    renderActiveRouteCard();
    renderNextStopCard();
    updateActivityTimeline();
    updateNotificationBadge();
}

function loadMyRoutes() {
    const allRoutes = getStorageArray('supply_routes');

    myRoutes = allRoutes.filter(route => {
        return String(route.assignedTo) === String(session.id);
    });

    renderRoutesList();
}

function loadDocuments() {
    const allDocuments = getStorageArray('supply_documents');

    documents = allDocuments.filter(documentItem => {
        return String(documentItem.createdBy) === String(session.id);
    });

    renderDocuments();
}

function loadReports() {
    const allReports = getStorageArray('supply_reports');

    reports = allReports.filter(report => {
        return String(report.createdBy) === String(session.id);
    });

    renderReports();
}

function getStorageArray(key) {
    const saved = localStorage.getItem(key);

    if (!saved) {
        return [];
    }

    try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

function saveStorageArray(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

/* =========================
   DASHBOARD HOME
   ========================= */

function getActiveRoute() {
    return myRoutes.find(route => route.status === 'in-progress') ||
        myRoutes.find(route => route.status === 'pending') ||
        null;
}

function renderActiveRouteCard() {
    const container = document.getElementById('activeRouteCard');

    if (!container) return;

    const activeRoute = getActiveRoute();

    if (!activeRoute) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:20px;">Sin ruta activa asignada</p>
        `;
        return;
    }

    container.innerHTML = `
        <div class="route-card-header">
            <div>
                <div class="route-name">${escapeHTML(activeRoute.origin)} - ${escapeHTML(activeRoute.destination)}</div>
                <small>Ruta ${escapeHTML(activeRoute.id)}</small>
            </div>

            <span class="route-badge ${escapeHTML(activeRoute.status)}">
                ${formatStatus(activeRoute.status)}
            </span>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width:${Number(activeRoute.progress || 0)}%"></div>
        </div>

        <div class="route-meta">
            <span>${Number(activeRoute.distance || 0)} km</span>
            <span>${Number(activeRoute.progress || 0)}%</span>
            <span>ETA: ${escapeHTML(activeRoute.eta || '--:--')}</span>
        </div>

        <div style="margin-top:14px;">
            <button class="btn-primary full-width" type="button" onclick="viewRouteDetail('${activeRoute.id}')">
                Ver Ruta
            </button>
        </div>
    `;
}

function renderNextStopCard() {
    const container = document.getElementById('nextStopCard');

    if (!container) return;

    const activeRoute = getActiveRoute();

    if (!activeRoute || !Array.isArray(activeRoute.stops) || activeRoute.stops.length === 0) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:20px;">Sin entregas pendientes</p>
        `;
        return;
    }

    const nextStop = activeRoute.stops.find(stop => !stop.completed);

    if (!nextStop) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:20px;">Todas las entregas fueron completadas</p>
        `;
        return;
    }

    const stopIndex = activeRoute.stops.findIndex(stop => stop === nextStop);

    container.innerHTML = `
        <div class="stop-item">
            <div class="stop-num">${stopIndex + 1}</div>

            <div class="stop-detail">
                <strong>${escapeHTML(nextStop.client || 'Cliente')}</strong>
                <small>${escapeHTML(nextStop.address || 'Direccion no registrada')}</small>
            </div>
        </div>

        <button class="btn-primary full-width" type="button" onclick="completeStop('${activeRoute.id}', ${stopIndex})">
            Completar Entrega
        </button>
    `;
}

function updateStats() {
    const allStops = getAllStops();
    const total = allStops.length;
    const done = allStops.filter(stop => stop.completed).length;
    const pending = total - done;
    const efficiency = total > 0 ? Math.round((done / total) * 100) : 0;

    setText('statToday', total);
    setText('statPending', pending);
    setText('statDone', done);
    setText('statEfficiency', efficiency + '%');
}

function updateNotificationBadge() {
    const pendingRoutes = myRoutes.filter(route => route.status === 'pending').length;
    const pendingReports = reports.filter(report => report.status === 'pending').length;

    setText('notificationBadge', pendingRoutes + pendingReports);
}

/* =========================
   RUTAS
   ========================= */

function renderRoutesList(filter = getActiveTabFilter('routes')) {
    const container = document.getElementById('routesList');

    if (!container) return;

    let filteredRoutes = [...myRoutes];

    if (filter !== 'all') {
        filteredRoutes = filteredRoutes.filter(route => route.status === filter);
    }

    if (filteredRoutes.length === 0) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:30px;">No hay rutas para mostrar</p>
        `;
        return;
    }

    container.innerHTML = filteredRoutes.map(route => {
        return `
            <div class="route-card" onclick="viewRouteDetail('${route.id}')">
                <div class="route-card-header">
                    <div>
                        <div class="route-name">${escapeHTML(route.origin)} - ${escapeHTML(route.destination)}</div>
                        <small>Ruta ${escapeHTML(route.id)}</small>
                    </div>

                    <span class="route-badge ${escapeHTML(route.status)}">
                        ${formatStatus(route.status)}
                    </span>
                </div>

                <div class="route-path-display">
                    <span>${escapeHTML(route.origin)}</span>
                    <span class="route-arrow">-</span>
                    <span>${escapeHTML(route.destination)}</span>
                </div>

                <div class="progress-bar">
                    <div class="progress-fill" style="width:${Number(route.progress || 0)}%"></div>
                </div>

                <div class="route-meta">
                    <span>${Number(route.distance || 0)} km</span>
                    <span>${Number(route.progress || 0)}%</span>
                    <span>ETA: ${escapeHTML(route.eta || '--:--')}</span>
                    <span>${Array.isArray(route.stops) ? route.stops.length : 0} entregas</span>
                </div>
            </div>
        `;
    }).join('');
}

function viewRouteDetail(routeId) {
    const route = myRoutes.find(item => item.id === routeId);

    if (!route) return;

    currentViewRoute = route;

    const routesList = document.getElementById('routesList');
    const detailView = document.getElementById('routeDetailView');

    if (routesList) routesList.classList.add('hidden');
    if (detailView) detailView.classList.remove('hidden');

    renderRouteDetail();
    initMap();

    showPage('routes');
}

function renderRouteDetail() {
    const panel = document.getElementById('routeInfoPanel');

    if (!panel || !currentViewRoute) return;

    const stops = Array.isArray(currentViewRoute.stops) ? currentViewRoute.stops : [];

    panel.innerHTML = `
        <div class="route-card-header">
            <div>
                <h3>${escapeHTML(currentViewRoute.origin)} - ${escapeHTML(currentViewRoute.destination)}</h3>
                <small>Ruta ${escapeHTML(currentViewRoute.id)}</small>
            </div>

            <span class="route-badge ${escapeHTML(currentViewRoute.status)}">
                ${formatStatus(currentViewRoute.status)}
            </span>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width:${Number(currentViewRoute.progress || 0)}%"></div>
        </div>

        <div class="route-meta" style="margin-bottom:18px;">
            <span>Distancia: ${Number(currentViewRoute.distance || 0)} km</span>
            <span>ETA: ${escapeHTML(currentViewRoute.eta || '--:--')}</span>
            <span>Progreso: ${Number(currentViewRoute.progress || 0)}%</span>
        </div>

        <h3 style="margin-bottom:12px;">Paradas Programadas</h3>

        ${
            stops.length === 0
                ? '<p style="color:#999;">Sin paradas registradas</p>'
                : stops.map((stop, index) => {
                    return `
                        <div class="stop-item">
                            <div class="stop-num">${index + 1}</div>

                            <div class="stop-detail">
                                <strong>${escapeHTML(stop.client || 'Cliente')}</strong>
                                <small>${escapeHTML(stop.address || 'Direccion no registrada')}</small>
                            </div>

                            ${
                                stop.completed
                                    ? '<span class="delivery-status completed">Completada</span>'
                                    : `<button class="btn-stop" type="button" onclick="completeStop('${currentViewRoute.id}', ${index})">Completar</button>`
                            }
                        </div>
                    `;
                }).join('')
        }

        <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;">
            ${
                currentViewRoute.status === 'pending'
                    ? `<button class="btn-primary" type="button" onclick="startRoute('${currentViewRoute.id}')">Iniciar Ruta</button>`
                    : ''
            }

            ${
                currentViewRoute.status === 'in-progress'
                    ? `<button class="btn-primary" type="button" onclick="completeRoute('${currentViewRoute.id}')">Completar Ruta</button>`
                    : ''
            }
        </div>
    `;
}

function startRoute(routeId) {
    updateRouteStatus(routeId, 'in-progress');
    addActivity('Ruta iniciada');
    refreshAfterRouteChange(routeId);
}

function completeRoute(routeId) {
    if (!confirm('Confirmar que has completado toda la ruta?')) {
        return;
    }

    const allRoutes = getStorageArray('supply_routes');
    const index = allRoutes.findIndex(route => route.id === routeId);

    if (index === -1) return;

    allRoutes[index].status = 'completed';
    allRoutes[index].progress = 100;
    allRoutes[index].completedAt = new Date().toISOString();

    if (Array.isArray(allRoutes[index].stops)) {
        allRoutes[index].stops = allRoutes[index].stops.map(stop => {
            return {
                ...stop,
                completed: true,
                completedAt: stop.completedAt || new Date().toISOString()
            };
        });
    }

    saveStorageArray('supply_routes', allRoutes);
    addActivity('Ruta completada');
    refreshAfterRouteChange(routeId);
}

function completeStop(routeId, stopIndex) {
    const allRoutes = getStorageArray('supply_routes');
    const routeIndex = allRoutes.findIndex(route => route.id === routeId);

    if (routeIndex === -1) return;

    const route = allRoutes[routeIndex];

    if (!Array.isArray(route.stops) || !route.stops[stopIndex]) {
        return;
    }

    route.stops[stopIndex].completed = true;
    route.stops[stopIndex].completedAt = new Date().toISOString();

    const totalStops = route.stops.length;
    const completedStops = route.stops.filter(stop => stop.completed).length;

    route.progress = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

    if (route.status === 'pending') {
        route.status = 'in-progress';
        route.startedAt = new Date().toISOString();
    }

    if (route.progress >= 100) {
        route.status = 'completed';
        route.completedAt = new Date().toISOString();
    }

    route.updatedAt = new Date().toISOString();

    allRoutes[routeIndex] = route;
    saveStorageArray('supply_routes', allRoutes);

    addActivity('Entrega completada: ' + (route.stops[stopIndex].client || 'Cliente'));
    refreshAfterRouteChange(routeId);
}

function updateRouteStatus(routeId, status) {
    const allRoutes = getStorageArray('supply_routes');
    const index = allRoutes.findIndex(route => route.id === routeId);

    if (index === -1) return;

    allRoutes[index].status = status;
    allRoutes[index].updatedAt = new Date().toISOString();

    if (status === 'in-progress') {
        allRoutes[index].startedAt = new Date().toISOString();
    }

    saveStorageArray('supply_routes', allRoutes);
}

function refreshAfterRouteChange(routeId) {
    loadMyRoutes();

    currentViewRoute = myRoutes.find(route => route.id === routeId) || null;

    if (currentViewRoute) {
        renderRouteDetail();
        initMap();
    }

    renderActiveRouteCard();
    renderNextStopCard();
    renderDeliveriesList();
    updateStats();
    updateNotificationBadge();
}

/* =========================
   MAPA DE RUTA
   ========================= */

function initMap() {
    const mapElement = document.getElementById('routeMap');

    if (!mapElement || !currentViewRoute || typeof L === 'undefined') {
        return;
    }

    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }

    const coords = getCityCoords(currentViewRoute.origin, currentViewRoute.destination);

    mapInstance = L.map('routeMap').setView([coords.origin.lat, coords.origin.lng], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap'
    }).addTo(mapInstance);

    const originMarker = L.marker([coords.origin.lat, coords.origin.lng])
        .addTo(mapInstance)
        .bindPopup('Origen: ' + escapeHTML(currentViewRoute.origin));

    const destinationMarker = L.marker([coords.dest.lat, coords.dest.lng])
        .addTo(mapInstance)
        .bindPopup('Destino: ' + escapeHTML(currentViewRoute.destination));

    const routeLine = L.polyline(
        [
            [coords.origin.lat, coords.origin.lng],
            [coords.dest.lat, coords.dest.lng]
        ],
        {
            color: '#e74c3c',
            weight: 4,
            opacity: 0.85
        }
    ).addTo(mapInstance);

    const progress = Number(currentViewRoute.progress || 0) / 100;

    const currentLat = coords.origin.lat + ((coords.dest.lat - coords.origin.lat) * progress);
    const currentLng = coords.origin.lng + ((coords.dest.lng - coords.origin.lng) * progress);

    L.circleMarker([currentLat, currentLng], {
        radius: 8,
        color: '#e74c3c',
        fillColor: '#e74c3c',
        fillOpacity: 1
    }).addTo(mapInstance).bindPopup('Ubicacion actual');

    mapInstance.fitBounds(routeLine.getBounds().pad(0.25));

    setTimeout(function () {
        mapInstance.invalidateSize();
        originMarker.openPopup();
        destinationMarker.closePopup();
    }, 250);
}

function getCityCoords(origin, destination) {
    const cities = {
        Lima: { lat: -12.0464, lng: -77.0428 },
        Arequipa: { lat: -16.4090, lng: -71.5375 },
        Trujillo: { lat: -8.1150, lng: -79.0300 },
        Chiclayo: { lat: -6.7714, lng: -79.8409 },
        Piura: { lat: -5.1945, lng: -80.6328 },
        Cusco: { lat: -13.5320, lng: -71.9675 },
        Huancayo: { lat: -12.0651, lng: -75.2049 },
        Ica: { lat: -14.0678, lng: -75.7286 },
        Tacna: { lat: -18.0146, lng: -70.2536 },
        Puno: { lat: -15.8402, lng: -70.0219 },
        Huacho: { lat: -11.1085, lng: -77.6103 },
        Chimbote: { lat: -9.0745, lng: -78.5936 },
        Cajamarca: { lat: -7.1638, lng: -78.5003 },
        Huaraz: { lat: -9.5333, lng: -77.5333 },
        Ayacucho: { lat: -13.1588, lng: -74.2238 },
        Iquitos: { lat: -3.7491, lng: -73.2538 },
        Pucallpa: { lat: -8.3791, lng: -74.5539 },
        Tarapoto: { lat: -6.4833, lng: -76.3667 }
    };

    return {
        origin: cities[origin] || cities.Lima,
        dest: cities[destination] || cities.Lima
    };
}

/* =========================
   ENTREGAS
   ========================= */

function getAllStops() {
    const stops = [];

    myRoutes.forEach(route => {
        if (!Array.isArray(route.stops)) return;

        route.stops.forEach((stop, index) => {
            stops.push({
                ...stop,
                stopIndex: index,
                routeId: route.id,
                routeOrigin: route.origin,
                routeDestination: route.destination,
                routeStatus: route.status
            });
        });
    });

    return stops;
}

function renderDeliveriesList(filter = getActiveTabFilter('deliveries')) {
    const container = document.getElementById('deliveriesList');

    if (!container) return;

    let stops = getAllStops();

    if (filter === 'pending') {
        stops = stops.filter(stop => !stop.completed);
    }

    if (filter === 'completed') {
        stops = stops.filter(stop => stop.completed);
    }

    if (stops.length === 0) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:30px;">No hay entregas para mostrar</p>
        `;
        return;
    }

    container.innerHTML = stops.map(stop => {
        return `
            <div class="delivery-card" onclick="showDeliveryDetail('${stop.routeId}', ${stop.stopIndex})">
                <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
                    <strong>${escapeHTML(stop.client || 'Cliente')}</strong>
                    <span class="delivery-status ${stop.completed ? 'completed' : 'pending'}">
                        ${stop.completed ? 'Completada' : 'Pendiente'}
                    </span>
                </div>

                <p style="font-size:13px;color:#666;margin-top:6px;">
                    ${escapeHTML(stop.address || 'Direccion no registrada')}
                </p>

                <small>Ruta: ${escapeHTML(stop.routeOrigin)} - ${escapeHTML(stop.routeDestination)}</small>
            </div>
        `;
    }).join('');
}

function showDeliveryDetail(routeId, stopIndex) {
    const route = myRoutes.find(item => item.id === routeId);

    if (!route || !Array.isArray(route.stops) || !route.stops[stopIndex]) {
        return;
    }

    const stop = route.stops[stopIndex];
    const container = document.getElementById('deliveryDetailContent');

    if (!container) return;

    container.innerHTML = `
        <div class="stop-item">
            <div class="stop-num">${stopIndex + 1}</div>

            <div class="stop-detail">
                <strong>${escapeHTML(stop.client || 'Cliente')}</strong>
                <small>${escapeHTML(stop.address || 'Direccion no registrada')}</small>
            </div>
        </div>

        <p><strong>Ruta:</strong> ${escapeHTML(route.origin)} - ${escapeHTML(route.destination)}</p>
        <p><strong>Estado:</strong> ${stop.completed ? 'Completada' : 'Pendiente'}</p>

        ${
            stop.completed
                ? `<p><strong>Completada:</strong> ${escapeHTML(formatDateTime(stop.completedAt))}</p>`
                : `<button class="btn-primary full-width" type="button" onclick="completeStop('${route.id}', ${stopIndex}); closeModal('modalDeliveryDetail');">Completar Entrega</button>`
        }
    `;

    openModal('modalDeliveryDetail');
}

/* =========================
   DOCUMENTOS
   ========================= */

function renderDocuments() {
    const container = document.getElementById('documentsGrid');

    if (!container) return;

    const filter = getValue('docTypeFilter') || 'all';

    let filteredDocuments = [...documents];

    if (filter !== 'all') {
        filteredDocuments = filteredDocuments.filter(documentItem => documentItem.type === filter);
    }

    if (filteredDocuments.length === 0) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:30px;grid-column:1/-1;">No hay documentos registrados</p>
        `;
        return;
    }

    container.innerHTML = filteredDocuments.map(documentItem => {
        return `
            <div class="document-card">
                <strong>${escapeHTML(documentItem.name || 'Documento')}</strong>
                <p>Tipo: ${escapeHTML(formatDocumentType(documentItem.type))}</p>
                <small>${escapeHTML(documentItem.date || '')}</small>

                ${
                    documentItem.description
                        ? `<p style="margin-top:8px;">${escapeHTML(documentItem.description)}</p>`
                        : ''
                }
            </div>
        `;
    }).join('');
}

function formatDocumentType(type) {
    const types = {
        foto: 'Foto',
        factura: 'Factura',
        guia: 'Guia'
    };

    return types[type] || type;
}

function takePhoto() {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.addEventListener('change', function (event) {
        const file = event.target.files[0];

        if (!file) return;

        const allDocuments = getStorageArray('supply_documents');

        const documentItem = {
            id: 'DOC' + Date.now(),
            name: file.name || 'Foto_' + Date.now() + '.jpg',
            type: 'foto',
            description: 'Foto tomada desde el dashboard',
            date: new Date().toLocaleDateString('es-PE'),
            createdAt: new Date().toISOString(),
            createdBy: session.id,
            createdByName: session.name
        };

        allDocuments.push(documentItem);
        saveStorageArray('supply_documents', allDocuments);

        addActivity('Documento registrado: Foto');
        loadDocuments();
        updateNotificationBadge();
    });

    input.click();
}

/* =========================
   REPORTES
   ========================= */

function renderReports() {
    const container = document.getElementById('reportsList');

    if (!container) return;

    const filter = getValue('reportStatusFilter') || 'all';

    let filteredReports = [...reports];

    if (filter !== 'all') {
        filteredReports = filteredReports.filter(report => report.status === filter);
    }

    if (filteredReports.length === 0) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:30px;">No hay reportes registrados</p>
        `;
        return;
    }

    container.innerHTML = filteredReports.map(report => {
        return `
            <div class="report-card ${escapeHTML(report.status)}">
                <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:8px;">
                    <strong>${escapeHTML(report.id)}</strong>

                    <span class="report-status ${escapeHTML(report.status)}">
                        ${formatStatus(report.status)}
                    </span>
                </div>

                <p><strong>Tipo:</strong> ${escapeHTML(formatReportType(report.type))}</p>
                <p>${escapeHTML(report.description || '')}</p>
                <small>${escapeHTML(report.date || '')}</small>

                ${
                    report.response
                        ? `<p style="margin-top:10px;padding:10px;background:#f8f9fa;border-radius:8px;"><strong>Respuesta:</strong> ${escapeHTML(report.response)}</p>`
                        : ''
                }
            </div>
        `;
    }).join('');
}

function formatReportType(type) {
    const types = {
        incidencia: 'Incidencia en Ruta',
        retraso: 'Retraso',
        danos: 'Danos en Carga',
        accidente: 'Accidente',
        otro: 'Otro'
    };

    return types[type] || type;
}

/* =========================
   ACTIVIDAD
   ========================= */

function addActivity(description) {
    const activities = getStorageArray('supply_activities');

    activities.unshift({
        id: 'ACT' + Date.now(),
        time: new Date().toLocaleTimeString('es-PE'),
        date: new Date().toLocaleDateString('es-PE'),
        createdAt: new Date().toISOString(),
        description,
        desc: description,
        userId: session.id,
        user: session.name
    });

    saveStorageArray('supply_activities', activities.slice(0, 80));
    updateActivityTimeline();
}

function updateActivityTimeline() {
    const container = document.getElementById('activityTimeline');

    if (!container) return;

    const activities = getStorageArray('supply_activities')
        .filter(activity => {
            return String(activity.userId) === String(session.id) ||
                String(activity.user) === String(session.name);
        })
        .slice(0, 10);

    if (activities.length === 0) {
        container.innerHTML = `
            <p style="color:#999;">Sin actividad reciente</p>
        `;
        return;
    }

    container.innerHTML = activities.map(activity => {
        return `
            <div class="timeline-item">
                <span>${escapeHTML(activity.description || activity.desc || '')}</span>
                <span class="timeline-time">${escapeHTML(activity.date || '')} ${escapeHTML(activity.time || '')}</span>
            </div>
        `;
    }).join('');
}

/* =========================
   NAVEGACION
   ========================= */

function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function (event) {
            event.preventDefault();

            const pageId = this.dataset.page;

            if (!pageId) return;

            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });

            this.classList.add('active');

            showPage(pageId);
            closeMenu();
        });
    });

    const backToRoutes = document.getElementById('backToRoutes');

    if (backToRoutes) {
        backToRoutes.addEventListener('click', function () {
            const detailView = document.getElementById('routeDetailView');
            const routesList = document.getElementById('routesList');

            if (detailView) detailView.classList.add('hidden');
            if (routesList) routesList.classList.remove('hidden');

            currentViewRoute = null;
            renderRoutesList();
        });
    }
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add('active');
    }

    if (pageId === 'home') {
        renderActiveRouteCard();
        renderNextStopCard();
        updateActivityTimeline();
        updateStats();
    }

    if (pageId === 'routes') {
        renderRoutesList();
    }

    if (pageId === 'deliveries') {
        renderDeliveriesList();
    }

    if (pageId === 'documents') {
        renderDocuments();
    }

    if (pageId === 'reports') {
        renderReports();
    }
}

/* =========================
   TABS
   ========================= */

function setupTabs() {
    document.querySelectorAll('.tabs-scroll').forEach(group => {
        const section = group.closest('.page');

        group.querySelectorAll('.tab-pill').forEach(tab => {
            tab.addEventListener('click', function () {
                group.querySelectorAll('.tab-pill').forEach(item => {
                    item.classList.remove('active');
                });

                this.classList.add('active');

                const filter = this.dataset.filter || 'all';

                if (section && section.id === 'routes') {
                    renderRoutesList(filter);
                }

                if (section && section.id === 'deliveries') {
                    renderDeliveriesList(filter);
                }
            });
        });
    });
}

function getActiveTabFilter(sectionId) {
    const activeTab = document.querySelector('#' + sectionId + ' .tab-pill.active');

    return activeTab ? activeTab.dataset.filter || 'all' : 'all';
}

/* =========================
   MODALES Y BOTONES
   ========================= */

function setupButtons() {
    const refreshButton = document.getElementById('btnRefreshHome');
    const syncButton = document.getElementById('syncBtn');

    if (refreshButton) {
        refreshButton.addEventListener('click', function () {
            loadAllData();
        });
    }

    if (syncButton) {
        syncButton.addEventListener('click', function () {
            loadAllData();
            syncButton.textContent = 'OK';

            setTimeout(function () {
                syncButton.textContent = 'Sync';
            }, 900);
        });
    }

    const docTypeFilter = document.getElementById('docTypeFilter');
    const reportStatusFilter = document.getElementById('reportStatusFilter');

    if (docTypeFilter) {
        docTypeFilter.addEventListener('change', renderDocuments);
    }

    if (reportStatusFilter) {
        reportStatusFilter.addEventListener('change', renderReports);
    }
}

function setupModals() {
    const uploadButton = document.getElementById('btnUploadFile');
    const takePhotoButton = document.getElementById('btnTakePhoto');
    const newReportButton = document.getElementById('btnNewReport');

    if (uploadButton) {
        uploadButton.addEventListener('click', function () {
            openModal('modalUpload');
        });
    }

    if (takePhotoButton) {
        takePhotoButton.addEventListener('click', takePhoto);
    }

    if (newReportButton) {
        newReportButton.addEventListener('click', function () {
            openModal('modalReport');
        });
    }

    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', function () {
            closeModal(this.dataset.closeModal);
        });
    });

    document.querySelectorAll('.modal-close').forEach(button => {
        button.addEventListener('click', function () {
            const modal = this.closest('.modal');

            if (modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });

            closeMenu();
        }
    });
}

function openModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.remove('active');
    }
}

/* =========================
   FORMULARIOS
   ========================= */

function setupForms() {
    const uploadForm = document.getElementById('formUpload');
    const reportForm = document.getElementById('formReport');

    if (uploadForm) {
        uploadForm.addEventListener('submit', saveDocumentFromForm);
    }

    if (reportForm) {
        reportForm.addEventListener('submit', saveReportFromForm);
    }
}

function saveDocumentFromForm(event) {
    event.preventDefault();

    const fileInput = document.getElementById('inputFile');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    const type = getValue('inputDocType');
    const description = getValue('inputDocDesc');

    if (!file) {
        alert('Selecciona un archivo.');
        return;
    }

    if (!type) {
        alert('Selecciona el tipo de documento.');
        return;
    }

    const allDocuments = getStorageArray('supply_documents');

    const documentItem = {
        id: 'DOC' + Date.now(),
        name: file.name,
        type,
        description,
        date: new Date().toLocaleDateString('es-PE'),
        createdAt: new Date().toISOString(),
        createdBy: session.id,
        createdByName: session.name
    };

    allDocuments.push(documentItem);
    saveStorageArray('supply_documents', allDocuments);

    event.target.reset();
    closeModal('modalUpload');

    addActivity('Documento registrado: ' + formatDocumentType(type));
    loadDocuments();
    updateNotificationBadge();
}

function saveReportFromForm(event) {
    event.preventDefault();

    const type = getValue('inputReportType');
    const description = getValue('inputReportDesc');
    const imageInput = document.getElementById('inputReportImage');
    const image = imageInput && imageInput.files ? imageInput.files[0] : null;

    if (!type || !description) {
        alert('Completa el tipo y la descripcion del reporte.');
        return;
    }

    const allReports = getStorageArray('supply_reports');

    const report = {
        id: 'REP' + Date.now(),
        type,
        description,
        status: 'pending',
        date: new Date().toLocaleDateString('es-PE'),
        createdAt: new Date().toISOString(),
        createdBy: session.id,
        createdByName: session.name,
        imageName: image ? image.name : '',
        response: null
    };

    allReports.push(report);
    saveStorageArray('supply_reports', allReports);

    event.target.reset();
    closeModal('modalReport');

    addActivity('Reporte enviado: ' + formatReportType(type));
    loadReports();
    updateNotificationBadge();
}

/* =========================
   TIEMPO REAL LOCAL
   ========================= */

function startPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    pollingInterval = setInterval(function () {
        loadAllData();

        if (currentViewRoute) {
            currentViewRoute = myRoutes.find(route => route.id === currentViewRoute.id) || currentViewRoute;
            renderRouteDetail();
        }
    }, 5000);

    window.addEventListener('storage', function (event) {
        const keys = [
            'supply_routes',
            'supply_documents',
            'supply_reports',
            'supply_activities'
        ];

        if (keys.includes(event.key)) {
            loadAllData();
        }
    });
}

/* =========================
   FECHAS
   ========================= */

function formatDateTime(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString('es-PE');
}

/* =========================
   FUNCIONES GLOBALES
   ========================= */

window.viewRouteDetail = viewRouteDetail;
window.startRoute = startRoute;
window.completeRoute = completeRoute;
window.completeStop = completeStop;
window.showDeliveryDetail = showDeliveryDetail;
window.closeModal = closeModal;