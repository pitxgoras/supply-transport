/* =========================================================
   ADMIN JS - FUNCIONAL, RESPONSIVE Y CONECTADO AL HTML/CSS
   Sistema: Supply Transport
   ========================================================= */

/* =========================
   VARIABLES GLOBALES
   ========================= */

let session = null;
let employees = [];
let routes = [];
let fleet = [];
let overviewMap = null;
let overviewLayer = null;
let pollingInterval = null;

/* =========================
   INICIO
   ========================= */

document.addEventListener('DOMContentLoaded', function () {
    session = getCurrentSession();

    if (!session || (session.role !== 'admin' && session.role !== 'manager')) {
        window.location.href = session ? 'dashboard.html' : 'login.html';
        return;
    }

    loadAllData();
    initUI();
    setupNavigation();
    setupForms();
    setupFilters();
    setupModalCloseEvents();
    renderAll();
    startPolling();
});

/* =========================
   SESION
   ========================= */

function getCurrentSession() {
    if (typeof checkSession === 'function') {
        return checkSession();
    }

    const savedSession =
        localStorage.getItem('supply_session') ||
        localStorage.getItem('session') ||
        localStorage.getItem('currentUser');

    if (savedSession) {
        try {
            return JSON.parse(savedSession);
        } catch (error) {
            return null;
        }
    }

    return {
        id: 'ADMIN001',
        name: 'Administrador',
        email: 'admin@supply.com',
        role: 'admin'
    };
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
   CARGA DE DATOS
   ========================= */

function loadAllData() {
    employees = loadEmployees();
    routes = loadRoutes();
    fleet = loadFleet();
    updateFleetStatus();
}

function loadEmployees() {
    const savedEmployees = localStorage.getItem('supply_employees');

    if (savedEmployees) {
        try {
            return JSON.parse(savedEmployees);
        } catch (error) {
            return [];
        }
    }

    return [];
}

function loadRoutes() {
    const savedRoutes = localStorage.getItem('supply_routes');

    if (!savedRoutes) {
        return [];
    }

    try {
        return JSON.parse(savedRoutes);
    } catch (error) {
        return [];
    }
}

function loadFleet() {
    const savedFleet = localStorage.getItem('supply_fleet');

    if (savedFleet) {
        try {
            return JSON.parse(savedFleet);
        } catch (error) {
            return [];
        }
    }

    const defaultFleet = [
        { id: 'ST-001', type: 'Tractocamion', status: 'available', plate: 'ABC-123' },
        { id: 'ST-002', type: 'Tractocamion', status: 'available', plate: 'ABC-456' },
        { id: 'ST-003', type: 'Camion Carga', status: 'available', plate: 'DEF-789' },
        { id: 'ST-004', type: 'Camion Carga', status: 'available', plate: 'DEF-012' },
        { id: 'ST-005', type: 'Utilitario', status: 'available', plate: 'GHI-345' },
        { id: 'ST-006', type: 'Tractocamion', status: 'maintenance', plate: 'GHI-678' },
        { id: 'ST-007', type: 'Camion Frio', status: 'available', plate: 'JKL-901' },
        { id: 'ST-008', type: 'Camion Frio', status: 'available', plate: 'JKL-234' }
    ];

    saveFleet(defaultFleet);
    return defaultFleet;
}

function saveEmployees(data) {
    localStorage.setItem('supply_employees', JSON.stringify(data));

    if (typeof employeesDatabase !== 'undefined') {
        employeesDatabase = data;
    }
}

function saveRoutes(data) {
    localStorage.setItem('supply_routes', JSON.stringify(data));
}

function saveFleet(data) {
    localStorage.setItem('supply_fleet', JSON.stringify(data));
}

/* =========================
   UI GENERAL
   ========================= */

function initUI() {
    setText('profileName', session.name || 'Administrador');
    setText('profileRole', formatRole(session.role || 'admin'));
    setText('profileAvatar', (session.name || 'A').charAt(0).toUpperCase());

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
        active: 'Activo',
        inactive: 'Inactivo',
        available: 'Disponible',
        'in-use': 'En Uso',
        maintenance: 'Mantenimiento',
        pending: 'Pendiente',
        'in-progress': 'En Progreso',
        completed: 'Completada',
        cancelled: 'Cancelada',
        approved: 'Aprobado',
        rejected: 'Rechazado'
    };

    return statuses[status] || status;
}

function getStatusClass(status) {
    return status || '';
}

/* =========================
   RENDER PRINCIPAL
   ========================= */

function renderAll() {
    renderStats();
    renderEmployees();
    renderRoutes();
    renderFleet();
    renderActiveOperators();
    renderTodayRoutes();
    renderAdminReports();
    renderOverviewMap();
    updateSyncTime();
}

function renderStats() {
    const reports = getReports();

    setText('statEmployees', employees.length);
    setText('statActiveRoutes', routes.filter(route => route.status === 'in-progress').length);
    setText('statFleet', fleet.filter(vehicle => vehicle.status === 'available').length + '/' + fleet.length);
    setText('statReports', reports.filter(report => report.status === 'pending').length);
}

/* =========================
   EMPLEADOS
   ========================= */

function renderEmployees() {
    const tbody = document.getElementById('employeesTable');

    if (!tbody) return;

    const search = getInputValue('searchEmp').toLowerCase();
    const role = getInputValue('filterRole');
    const status = getInputValue('filterStatus');

    const filteredEmployees = employees.filter(employee => {
        const matchesSearch =
            employee.name.toLowerCase().includes(search) ||
            employee.email.toLowerCase().includes(search) ||
            employee.id.toLowerCase().includes(search);

        const matchesRole = !role || employee.role === role;
        const matchesStatus = !status || employee.status === status;

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (filteredEmployees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:22px;">No hay empleados registrados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredEmployees.map(employee => {
        const activeRoute = routes.find(route => {
            return route.assignedTo === employee.id && route.status === 'in-progress';
        });

        return `
            <tr>
                <td>${escapeHTML(employee.id)}</td>
                <td>${escapeHTML(employee.name)}</td>
                <td>${escapeHTML(employee.email)}</td>
                <td>${escapeHTML(formatRole(employee.role))}</td>
                <td>${activeRoute ? escapeHTML(activeRoute.origin + ' - ' + activeRoute.destination) : '-'}</td>
                <td>
                    <span class="status-badge ${getStatusClass(employee.status)}">
                        ${formatStatus(employee.status)}
                    </span>
                </td>
                <td>
                    <button class="btn-icon btn-edit" type="button" onclick="editEmployee('${employee.id}')">Editar</button>
                    ${employee.role === 'operator' ? `<button class="btn-icon btn-route" type="button" onclick="quickAssign('${employee.id}')">Ruta</button>` : ''}
                    ${session.role === 'admin' ? `<button class="btn-icon btn-delete" type="button" onclick="deleteEmployee('${employee.id}')">Eliminar</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function showAddEmployee() {
    const form = document.getElementById('formEmployee');

    setText('modalEmpTitle', 'Agregar Empleado');

    if (form) {
        form.reset();
    }

    setInputValue('empId', '');
    openModal('employeeModal');
}

function editEmployee(id) {
    const employee = employees.find(item => item.id === id);

    if (!employee) return;

    setText('modalEmpTitle', 'Editar Empleado');

    setInputValue('empId', employee.id);
    setInputValue('empName', employee.name);
    setInputValue('empEmail', employee.email);
    setInputValue('empPassword', employee.password);
    setInputValue('empRole', employee.role);
    setInputValue('empStatus', employee.status);

    openModal('employeeModal');
}

function deleteEmployee(id) {
    if (session.role !== 'admin') {
        alert('Solo el administrador puede eliminar empleados.');
        return;
    }

    const hasRoutes = routes.some(route => {
        return route.assignedTo === id && route.status === 'in-progress';
    });

    if (hasRoutes) {
        alert('No se puede eliminar un empleado con ruta activa.');
        return;
    }

    if (!confirm('Deseas eliminar este empleado?')) {
        return;
    }

    employees = employees.filter(employee => employee.id !== id);
    saveEmployees(employees);
    renderAll();
}

/* =========================
   RUTAS
   ========================= */

function renderRoutes() {
    const tbody = document.getElementById('routesTable');

    if (!tbody) return;

    const filter = getInputValue('filterRouteStatus');

    const filteredRoutes = filter
        ? routes.filter(route => route.status === filter)
        : routes;

    if (filteredRoutes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:22px;">No hay rutas registradas</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredRoutes.map(route => {
        return `
            <tr>
                <td>${escapeHTML(route.id)}</td>
                <td>
                    <strong>${escapeHTML(route.origin)}</strong> - ${escapeHTML(route.destination)}
                </td>
                <td>${escapeHTML(route.operatorName || '-')}</td>
                <td>${escapeHTML(route.vehicleId || '-')}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width:${Number(route.progress || 0)}%"></div>
                    </div>
                    ${Number(route.progress || 0)}%
                </td>
                <td>
                    <span class="route-badge ${getStatusClass(route.status)}">
                        ${formatStatus(route.status)}
                    </span>
                </td>
                <td>
                    <button class="btn-icon btn-edit" type="button" onclick="viewRouteDetail('${route.id}')">Ver</button>
                    ${route.status === 'pending' ? `<button class="btn-icon btn-route" type="button" onclick="startRoute('${route.id}')">Iniciar</button>` : ''}
                    ${route.status === 'in-progress' ? `<button class="btn-icon btn-route" type="button" onclick="advanceRoute('${route.id}')">Avanzar</button>` : ''}
                    ${route.status !== 'completed' && route.status !== 'cancelled' ? `<button class="btn-icon btn-delete" type="button" onclick="cancelRoute('${route.id}')">Cancelar</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function showRouteModal() {
    const operatorSelect = document.getElementById('routeOperator');
    const vehicleSelect = document.getElementById('routeVehicle');
    const stopsContainer = document.getElementById('stopsContainer');
    const form = document.getElementById('formRoute');

    if (form) {
        form.reset();
    }

    const operators = employees.filter(employee => {
        const hasActiveRoute = routes.some(route => {
            return route.assignedTo === employee.id &&
                (route.status === 'pending' || route.status === 'in-progress');
        });

        return employee.role === 'operator' &&
            employee.status === 'active' &&
            !hasActiveRoute;
    });

    const availableVehicles = fleet.filter(vehicle => vehicle.status === 'available');

    if (operatorSelect) {
        operatorSelect.innerHTML = `
            <option value="">Seleccionar Operador</option>
            ${operators.map(operator => `<option value="${operator.id}">${escapeHTML(operator.name)}</option>`).join('')}
        `;
    }

    if (vehicleSelect) {
        vehicleSelect.innerHTML = `
            <option value="">Seleccionar Vehiculo</option>
            ${availableVehicles.map(vehicle => `<option value="${vehicle.id}">${escapeHTML(vehicle.id + ' - ' + vehicle.type + ' - ' + vehicle.plate)}</option>`).join('')}
        `;
    }

    if (stopsContainer) {
        stopsContainer.innerHTML = '';
        addStopRow();
    }

    openModal('routeModal');
}

function quickAssign(employeeId) {
    showRouteModal();

    setTimeout(function () {
        setInputValue('routeOperator', employeeId);
    }, 50);
}

function startRoute(id) {
    const route = routes.find(item => item.id === id);

    if (!route) return;

    route.status = 'in-progress';
    route.startedAt = new Date().toISOString();

    saveRoutes(routes);
    updateFleetStatus();
    renderAll();
}

function advanceRoute(id) {
    const route = routes.find(item => item.id === id);

    if (!route) return;

    const currentProgress = Number(route.progress || 0);
    const nextProgress = Math.min(currentProgress + 25, 100);

    route.progress = nextProgress;
    route.updatedAt = new Date().toISOString();

    if (nextProgress >= 100) {
        route.status = 'completed';
        route.completedAt = new Date().toISOString();
    }

    saveRoutes(routes);
    updateFleetStatus();
    renderAll();
}

function cancelRoute(id) {
    if (!confirm('Deseas cancelar esta ruta?')) {
        return;
    }

    const route = routes.find(item => item.id === id);

    if (!route) return;

    route.status = 'cancelled';
    route.cancelledAt = new Date().toISOString();

    saveRoutes(routes);
    updateFleetStatus();
    renderAll();
}

function viewRouteDetail(id) {
    const route = routes.find(item => item.id === id);

    if (!route) return;

    const stops = Array.isArray(route.stops) && route.stops.length > 0
        ? route.stops.map((stop, index) => {
            return `${index + 1}. ${stop.address} - ${stop.client}`;
        }).join('\n')
        : 'Sin paradas registradas';

    alert(
        'Ruta: ' + route.id + '\n' +
        'Origen: ' + route.origin + '\n' +
        'Destino: ' + route.destination + '\n' +
        'Operador: ' + route.operatorName + '\n' +
        'Vehiculo: ' + route.vehicleId + '\n' +
        'Distancia: ' + route.distance + ' km\n' +
        'ETA: ' + route.eta + '\n' +
        'Progreso: ' + route.progress + '%\n' +
        'Estado: ' + formatStatus(route.status) + '\n\n' +
        'Paradas:\n' + stops
    );
}

function addStopRow() {
    const container = document.getElementById('stopsContainer');

    if (!container) return;

    const row = document.createElement('div');
    row.className = 'stop-row';

    row.innerHTML = `
        <input type="text" class="stop-address input-text" placeholder="Direccion de parada">
        <input type="text" class="stop-client input-text" placeholder="Nombre del cliente">
        <button type="button" class="btn-icon btn-remove" onclick="this.closest('.stop-row').remove()">X</button>
    `;

    container.appendChild(row);
}

/* =========================
   FLOTA
   ========================= */

function updateFleetStatus() {
    fleet = fleet.map(vehicle => {
        if (vehicle.status === 'maintenance') {
            return vehicle;
        }

        const assignedRoute = routes.find(route => {
            return route.vehicleId === vehicle.id &&
                (route.status === 'pending' || route.status === 'in-progress');
        });

        return {
            ...vehicle,
            status: assignedRoute ? 'in-use' : 'available'
        };
    });

    saveFleet(fleet);
}

function renderFleet() {
    const tbody = document.getElementById('fleetTable');

    if (!tbody) return;

    if (fleet.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;padding:22px;">No hay vehiculos registrados</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = fleet.map(vehicle => {
        const route = routes.find(item => {
            return item.vehicleId === vehicle.id &&
                (item.status === 'pending' || item.status === 'in-progress');
        });

        return `
            <tr>
                <td>${escapeHTML(vehicle.id)}</td>
                <td>${escapeHTML(vehicle.type)}<br><small>${escapeHTML(vehicle.plate || '')}</small></td>
                <td>${route ? escapeHTML(route.operatorName) : 'Disponible'}</td>
                <td>
                    <span class="status-badge ${getStatusClass(vehicle.status)}">
                        ${formatStatus(vehicle.status)}
                    </span>
                </td>
                <td>${route ? escapeHTML(route.origin + ' - ' + route.destination) : 'Base'}</td>
            </tr>
        `;
    }).join('');
}

/* =========================
   DASHBOARD
   ========================= */

function renderActiveOperators() {
    const container = document.getElementById('activeOperatorsList');

    if (!container) return;

    const activeRoutes = routes.filter(route => route.status === 'in-progress');

    if (activeRoutes.length === 0) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:20px;">Sin operadores en ruta</p>
        `;
        return;
    }

    container.innerHTML = activeRoutes.map(route => {
        return `
            <div class="active-operator">
                <div>
                    <strong>${escapeHTML(route.operatorName)}</strong><br>
                    <small>${escapeHTML(route.origin)} - ${escapeHTML(route.destination)}</small>
                </div>
                <span class="route-badge in-progress">${Number(route.progress || 0)}%</span>
            </div>
        `;
    }).join('');
}

function renderTodayRoutes() {
    const container = document.getElementById('todayRoutesList');

    if (!container) return;

    const today = new Date().toDateString();

    const todayRoutes = routes.filter(route => {
        const dateValue = route.createdAt || route.assignedAt || route.startedAt;
        if (!dateValue) return false;

        return new Date(dateValue).toDateString() === today;
    });

    if (todayRoutes.length === 0) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:20px;">Sin rutas hoy</p>
        `;
        return;
    }

    container.innerHTML = todayRoutes.map(route => {
        return `
            <div class="today-route">
                <div>
                    <strong>${escapeHTML(route.id)}</strong><br>
                    <small>${escapeHTML(route.operatorName || '-')}</small>
                </div>
                <span class="route-badge ${getStatusClass(route.status)}">${formatStatus(route.status)}</span>
            </div>
        `;
    }).join('');
}

/* =========================
   MAPA
   ========================= */

function renderOverviewMap() {
    const mapElement = document.getElementById('overviewMap');

    if (!mapElement || typeof L === 'undefined') {
        return;
    }

    const cityCoords = {
        Lima: [-12.0464, -77.0428],
        Arequipa: [-16.4090, -71.5375],
        Trujillo: [-8.1150, -79.0300],
        Chiclayo: [-6.7714, -79.8409],
        Piura: [-5.1945, -80.6328],
        Cusco: [-13.5320, -71.9675],
        Huancayo: [-12.0651, -75.2049],
        Ica: [-14.0678, -75.7286],
        Tacna: [-18.0146, -70.2536],
        Huacho: [-11.1085, -77.6103],
        Chimbote: [-9.0745, -78.5936],
        Cajamarca: [-7.1638, -78.5003],
        Huaraz: [-9.5333, -77.5333],
        Ayacucho: [-13.1588, -74.2238]
    };

    if (!overviewMap) {
        overviewMap = L.map('overviewMap').setView([-9.19, -75.0152], 6);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'OpenStreetMap'
        }).addTo(overviewMap);
    }

    if (overviewLayer) {
        overviewLayer.clearLayers();
    } else {
        overviewLayer = L.layerGroup().addTo(overviewMap);
    }

    const activeRoutes = routes.filter(route => {
        return route.status === 'pending' || route.status === 'in-progress';
    });

    activeRoutes.forEach(route => {
        const originCoords = cityCoords[route.origin] || cityCoords.Lima;
        const destinationCoords = cityCoords[route.destination] || cityCoords.Lima;

        L.marker(originCoords)
            .bindPopup('Origen: ' + route.origin + '<br>Operador: ' + route.operatorName)
            .addTo(overviewLayer);

        L.marker(destinationCoords)
            .bindPopup('Destino: ' + route.destination + '<br>Operador: ' + route.operatorName)
            .addTo(overviewLayer);

        L.polyline([originCoords, destinationCoords], {
            color: '#e74c3c',
            weight: 4,
            opacity: 0.8
        }).addTo(overviewLayer);
    });

    setTimeout(function () {
        overviewMap.invalidateSize();
    }, 200);
}

/* =========================
   REPORTES
   ========================= */

function getReports() {
    const savedReports = localStorage.getItem('supply_reports');

    if (!savedReports) {
        return [];
    }

    try {
        return JSON.parse(savedReports);
    } catch (error) {
        return [];
    }
}

function saveReports(reports) {
    localStorage.setItem('supply_reports', JSON.stringify(reports));
}

function renderAdminReports() {
    const container = document.getElementById('adminReportsList');

    if (!container) return;

    const filter = getInputValue('adminReportFilter') || 'all';
    const reports = getReports();

    const filteredReports = filter === 'all'
        ? reports
        : reports.filter(report => report.status === filter);

    if (filteredReports.length === 0) {
        container.innerHTML = `
            <p style="color:#999;text-align:center;padding:30px;">No hay reportes</p>
        `;
        return;
    }

    container.innerHTML = filteredReports.map(report => {
        return `
            <div class="admin-report-card ${getStatusClass(report.status)}">
                <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:8px;flex-wrap:wrap;">
                    <strong>${escapeHTML(report.id || 'Reporte')} - ${escapeHTML(report.createdByName || 'Operador')}</strong>
                    <span class="route-badge ${getStatusClass(report.status)}">${formatStatus(report.status)}</span>
                </div>

                <p><strong>Tipo:</strong> ${escapeHTML(report.type || '-')}</p>
                <p>${escapeHTML(report.description || '-')}</p>
                <small>${escapeHTML(report.date || report.createdAt || '')}</small>

                ${report.status === 'pending' ? `
                    <div class="report-actions-row">
                        <button class="btn-stop" type="button" onclick="approveReport('${report.id}')">Aprobar</button>
                        <button class="btn-stop" type="button" style="background:#e74c3c;" onclick="rejectReport('${report.id}')">Rechazar</button>
                    </div>
                ` : ''}

                ${report.response ? `
                    <p style="margin-top:10px;padding:10px;background:#f8f9fa;border-radius:8px;">
                        <strong>Respuesta:</strong> ${escapeHTML(report.response)}
                    </p>
                ` : ''}
            </div>
        `;
    }).join('');
}

function approveReport(id) {
    updateReport(id, 'approved', 'Aprobado por ' + session.name);
}

function rejectReport(id) {
    const reason = prompt('Motivo del rechazo:');

    if (!reason) {
        return;
    }

    updateReport(id, 'rejected', reason);
}

function updateReport(id, status, response) {
    const reports = getReports();
    const index = reports.findIndex(report => report.id === id);

    if (index === -1) return;

    reports[index].status = status;
    reports[index].response = response;
    reports[index].respondedAt = new Date().toISOString();

    saveReports(reports);
    renderAll();
}

/* =========================
   NAVEGACION
   ========================= */

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', function (event) {
            event.preventDefault();

            const pageId = this.dataset.page;

            if (!pageId) return;

            document.querySelectorAll('.nav-item').forEach(nav => {
                nav.classList.remove('active');
            });

            document.querySelectorAll('.page').forEach(page => {
                page.classList.remove('active');
            });

            this.classList.add('active');

            const page = document.getElementById(pageId);

            if (page) {
                page.classList.add('active');
            }

            closeMenu();

            if (pageId === 'dashboard') {
                renderOverviewMap();
            }
        });
    });
}

/* =========================
   FORMULARIOS
   ========================= */

function setupForms() {
    const employeeForm = document.getElementById('formEmployee');
    const routeForm = document.getElementById('formRoute');

    if (employeeForm) {
        employeeForm.addEventListener('submit', saveEmployeeFromForm);
    }

    if (routeForm) {
        routeForm.addEventListener('submit', saveRouteFromForm);
    }
}

function saveEmployeeFromForm(event) {
    event.preventDefault();

    const id = getInputValue('empId');
    const name = getInputValue('empName');
    const email = getInputValue('empEmail');
    const password = getInputValue('empPassword');
    const role = getInputValue('empRole');
    const status = getInputValue('empStatus');

    if (!name || !email || !password || !role) {
        alert('Completa todos los campos obligatorios.');
        return;
    }

    const emailExists = employees.some(employee => {
        return employee.email === email && employee.id !== id;
    });

    if (emailExists) {
        alert('Ya existe un empleado con este correo.');
        return;
    }

    if (id) {
        const index = employees.findIndex(employee => employee.id === id);

        if (index !== -1) {
            employees[index] = {
                ...employees[index],
                name,
                email,
                password,
                role,
                status
            };
        }
    } else {
        employees.push({
            id: generateEmployeeId(),
            name,
            email,
            password,
            role,
            status
        });
    }

    saveEmployees(employees);
    closeModal('employeeModal');
    renderAll();
}

function saveRouteFromForm(event) {
    event.preventDefault();

    const operatorId = getInputValue('routeOperator');
    const vehicleId = getInputValue('routeVehicle');
    const origin = getInputValue('routeOrigin');
    const destination = getInputValue('routeDestination');
    const distance = Number(getInputValue('routeDistance'));
    const eta = getInputValue('routeETA');

    if (!operatorId || !vehicleId || !origin || !destination || !distance || !eta) {
        alert('Completa todos los campos de la ruta.');
        return;
    }

    const operator = employees.find(employee => employee.id === operatorId);

    if (!operator) {
        alert('Operador no encontrado.');
        return;
    }

    const operatorBusy = routes.some(route => {
        return route.assignedTo === operatorId &&
            (route.status === 'pending' || route.status === 'in-progress');
    });

    if (operatorBusy) {
        alert('Este operador ya tiene una ruta pendiente o activa.');
        return;
    }

    const vehicleBusy = routes.some(route => {
        return route.vehicleId === vehicleId &&
            (route.status === 'pending' || route.status === 'in-progress');
    });

    if (vehicleBusy) {
        alert('Este vehiculo ya tiene una ruta pendiente o activa.');
        return;
    }

    const stops = [];

    document.querySelectorAll('.stop-row').forEach(row => {
        const addressInput = row.querySelector('.stop-address');
        const clientInput = row.querySelector('.stop-client');

        const address = addressInput ? addressInput.value.trim() : '';
        const client = clientInput ? clientInput.value.trim() : '';

        if (address || client) {
            stops.push({
                address,
                client,
                completed: false
            });
        }
    });

    const newRoute = {
        id: generateRouteId(),
        origin,
        destination,
        distance,
        eta,
        status: 'pending',
        progress: 0,
        assignedTo: operatorId,
        operatorName: operator.name,
        vehicleId,
        stops,
        createdAt: new Date().toISOString(),
        assignedAt: new Date().toISOString(),
        assignedBy: session.name
    };

    routes.push(newRoute);

    saveRoutes(routes);
    updateFleetStatus();
    closeModal('routeModal');
    renderAll();

    alert('Ruta asignada correctamente a ' + operator.name + '.');
}

/* =========================
   FILTROS
   ========================= */

function setupFilters() {
    bindInput('searchEmp', renderEmployees);
    bindInput('filterRole', renderEmployees);
    bindInput('filterStatus', renderEmployees);
    bindInput('filterRouteStatus', renderRoutes);
    bindInput('adminReportFilter', renderAdminReports);
}

function bindInput(id, callback) {
    const element = document.getElementById(id);

    if (!element) return;

    element.addEventListener('input', callback);
    element.addEventListener('change', callback);
}

/* =========================
   MODALES
   ========================= */

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

function setupModalCloseEvents() {
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

/* =========================
   IMPORTAR / EXPORTAR
   ========================= */

function exportData() {
    downloadJSON(employees, 'empleados');
}

function exportRoutes() {
    downloadJSON(routes, 'rutas');
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
    });

    const link = document.createElement('a');

    link.href = URL.createObjectURL(blob);
    link.download = filename + '_' + getDateFileName() + '.json';
    link.click();

    URL.revokeObjectURL(link.href);
}

function importData() {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = '.json';

    input.addEventListener('change', function (event) {
        const file = event.target.files[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onload = function (readerEvent) {
            try {
                const importedEmployees = JSON.parse(readerEvent.target.result);

                if (!Array.isArray(importedEmployees)) {
                    alert('El archivo no contiene una lista valida de empleados.');
                    return;
                }

                employees = importedEmployees;
                saveEmployees(employees);
                renderAll();

                alert('Empleados importados correctamente.');
            } catch (error) {
                alert('No se pudo importar el archivo.');
            }
        };

        reader.readAsText(file);
    });

    input.click();
}

function clearAllData() {
    if (!confirm('Deseas eliminar rutas, reportes, documentos y actividades?')) {
        return;
    }

    localStorage.removeItem('supply_routes');
    localStorage.removeItem('supply_reports');
    localStorage.removeItem('supply_documents');
    localStorage.removeItem('supply_activities');

    routes = [];
    updateFleetStatus();
    renderAll();

    alert('Datos limpiados correctamente.');
}

/* =========================
   SINCRONIZACION EN TIEMPO REAL LOCAL
   ========================= */

function syncAll() {
    loadAllData();
    renderAll();
}

function startPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }

    pollingInterval = setInterval(function () {
        loadAllData();
        renderAll();
    }, 5000);

    window.addEventListener('storage', function (event) {
        const watchedKeys = [
            'supply_employees',
            'supply_routes',
            'supply_fleet',
            'supply_reports',
            'supply_documents',
            'supply_activities'
        ];

        if (watchedKeys.includes(event.key)) {
            loadAllData();
            renderAll();
        }
    });
}

function updateSyncTime() {
    const element = document.getElementById('syncTime');

    if (!element) return;

    element.textContent = new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/* =========================
   UTILIDADES
   ========================= */

function getInputValue(id) {
    const element = document.getElementById(id);

    if (!element) return '';

    return element.value.trim();
}

function setInputValue(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.value = value || '';
    }
}

function generateEmployeeId() {
    const numbers = employees
        .map(employee => Number(String(employee.id).replace(/\D/g, '')))
        .filter(number => !Number.isNaN(number));

    const next = numbers.length ? Math.max(...numbers) + 1 : 1;

    return 'EMP' + String(next).padStart(3, '0');
}

function generateRouteId() {
    return 'R' + new Date().getTime();
}

function getDateFileName() {
    return new Date().toISOString().split('T')[0];
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
   FUNCIONES GLOBALES PARA HTML
   ========================= */

window.showAddEmployee = showAddEmployee;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.quickAssign = quickAssign;

window.showRouteModal = showRouteModal;
window.addStopRow = addStopRow;
window.startRoute = startRoute;
window.advanceRoute = advanceRoute;
window.cancelRoute = cancelRoute;
window.viewRouteDetail = viewRouteDetail;

window.closeModal = closeModal;

window.approveReport = approveReport;
window.rejectReport = rejectReport;

window.exportData = exportData;
window.exportRoutes = exportRoutes;
window.importData = importData;
window.clearAllData = clearAllData;
window.syncAll = syncAll;