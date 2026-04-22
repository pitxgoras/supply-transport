// ADMIN - ASIGNAR RUTAS

let session = null;
let employees = [];
let routes = [];
let vehicles = [];

document.addEventListener('DOMContentLoaded', function() {
    session = checkSession();
    if (!session) return;
    if (session.role !== 'admin' && session.role !== 'manager') {
        window.location.href = 'dashboard.html';
        return;
    }
    
    initUI();
    loadData();
    setupNavigation();
    setupFilters();
    setupForms();
});

function initUI() {
    document.getElementById('userName').textContent = session.name;
    document.getElementById('userRole').textContent = formatRole(session.role);
    
    const toggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const close = document.getElementById('sidebarClose');
    
    if (toggle) toggle.addEventListener('click', () => sidebar.classList.add('active'));
    if (close) close.addEventListener('click', () => sidebar.classList.remove('active'));
}

function formatRole(role) {
    const r = { admin: 'Admin', manager: 'Gerente', supervisor: 'Supervisor', operator: 'Operador' };
    return r[role] || role;
}

function loadData() {
    employees = [...employeesDatabase];
    loadRoutes();
    loadVehicles();
    
    document.getElementById('totalEmp').textContent = employees.length;
    updateStats();
    renderEmployees();
    renderRoutes();
    renderFleet();
    renderActiveRoutes();
    renderAdminReports();
}

function loadRoutes() {
    const saved = localStorage.getItem('supply_routes');
    routes = saved ? JSON.parse(saved) : [];
}

function loadVehicles() {
    vehicles = [
        { id: 'ST-045', type: 'Tractocamion', status: 'available' },
        { id: 'ST-128', type: 'Camion', status: 'available' },
        { id: 'ST-089', type: 'Utilitario', status: 'available' },
        { id: 'ST-067', type: 'Tractocamion', status: 'maintenance' }
    ];
}

function updateStats() {
    const activeRoutes = routes.filter(r => r.status === 'in-progress').length;
    document.getElementById('activeRoutes').textContent = activeRoutes;
}

function renderEmployees() {
    const tbody = document.getElementById('employeesTable');
    if (!tbody) return;
    
    const search = document.getElementById('searchEmp')?.value.toLowerCase() || '';
    const role = document.getElementById('filterRole')?.value || '';
    
    let filtered = employees.filter(e => 
        (e.name.toLowerCase().includes(search) || e.email.toLowerCase().includes(search)) &&
        (!role || e.role === role)
    );
    
    tbody.innerHTML = filtered.map(e => {
        const employeeRoute = routes.find(r => r.assignedTo === e.id && r.status !== 'completed');
        return `
            <tr>
                <td>${e.id}</td>
                <td>${e.name}</td>
                <td>${e.email}</td>
                <td>${formatRole(e.role)}</td>
                <td><span class="status ${e.status}">${e.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
                <td>${employeeRoute ? `${employeeRoute.origin} → ${employeeRoute.destination}` : 'Sin ruta'}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="editEmployee('${e.id}')">Editar</button>
                    ${e.role === 'operator' ? `<button class="btn-icon btn-route" onclick="assignRouteTo('${e.id}')">Asignar Ruta</button>` : ''}
                    ${session.role === 'admin' ? `<button class="btn-icon btn-delete" onclick="deleteEmployee('${e.id}')">Eliminar</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function renderRoutes() {
    const tbody = document.getElementById('routesTable');
    if (!tbody) return;
    
    tbody.innerHTML = routes.map(r => `
        <tr>
            <td>${r.id}</td>
            <td>${r.origin}</td>
            <td>${r.destination}</td>
            <td>${r.operatorName || 'No asignado'}</td>
            <td><span class="status ${r.status}">${getStatusText(r.status)}</span></td>
            <td>
                <div class="progress-bar small">
                    <div class="progress-fill" style="width: ${r.progress || 0}%"></div>
                </div>
                ${r.progress || 0}%
            </td>
            <td>
                <button class="btn-icon btn-edit" onclick="viewRoute('${r.id}')">Ver</button>
                ${r.status !== 'completed' ? `<button class="btn-icon btn-delete" onclick="cancelRoute('${r.id}')">Cancelar</button>` : ''}
            </td>
        </tr>
    `).join('');
}

function getStatusText(status) {
    const s = { pending: 'Pendiente', 'in-progress': 'En Progreso', completed: 'Completado' };
    return s[status] || status;
}

function renderFleet() {
    const tbody = document.getElementById('fleetTable');
    if (!tbody) return;
    
    tbody.innerHTML = vehicles.map(v => {
        const assignedRoute = routes.find(r => r.vehicleId === v.id && r.status === 'in-progress');
        return `
            <tr>
                <td>${v.id}</td>
                <td>${v.type}</td>
                <td>${assignedRoute?.operatorName || 'Disponible'}</td>
                <td><span class="status ${v.status}">${v.status === 'available' ? 'Disponible' : v.status === 'in-use' ? 'En uso' : 'Mantenimiento'}</span></td>
                <td>${assignedRoute?.currentLocation ? 'En ruta' : 'Base'}</td>
            </tr>
        `;
    }).join('');
}

function renderActiveRoutes() {
    const container = document.getElementById('activeRoutesList');
    const operatorsContainer = document.getElementById('activeOperators');
    
    const active = routes.filter(r => r.status === 'in-progress');
    
    if (container) {
        container.innerHTML = active.length === 0 ? '<p>No hay rutas activas</p>' : active.map(r => `
            <div class="active-route-item">
                <strong>${r.id}</strong>
                <span>${r.operatorName}</span>
                <span>${r.origin} → ${r.destination}</span>
                <div class="progress-bar small">
                    <div class="progress-fill" style="width: ${r.progress || 0}%"></div>
                </div>
            </div>
        `).join('');
    }
    
    if (operatorsContainer) {
        const operators = [...new Set(active.map(r => r.operatorName))];
        operatorsContainer.innerHTML = operators.length === 0 ? '<p>No hay operadores en ruta</p>' : operators.map(op => `
            <div class="operator-item">
                <span>🚛 ${op}</span>
                <span class="status in-progress">En ruta</span>
            </div>
        `).join('');
    }
}

function renderAdminReports() {
    const container = document.getElementById('adminReportsList');
    if (!container) return;
    
    const saved = localStorage.getItem('supply_reports');
    const reports = saved ? JSON.parse(saved) : [];
    const filter = document.getElementById('adminReportFilter')?.value || 'all';
    
    let filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
    
    container.innerHTML = filtered.map(r => `
        <div class="admin-report-card ${r.status}">
            <div class="report-header">
                <span><strong>${r.id}</strong> - ${r.createdByName}</span>
                <span class="status ${r.status}">${r.status}</span>
            </div>
            <p><strong>Tipo:</strong> ${r.type}</p>
            <p>${r.description}</p>
            <small>${r.date}</small>
            ${r.status === 'pending' ? `
                <div class="report-actions">
                    <button class="btn-small btn-approve" onclick="approveReport('${r.id}')">Aprobar</button>
                    <button class="btn-small btn-reject" onclick="rejectReport('${r.id}')">Rechazar</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function approveReport(id) {
    updateReportStatus(id, 'approved', 'Reporte aprobado');
}

function rejectReport(id) {
    const reason = prompt('Motivo del rechazo:');
    if (reason) {
        updateReportStatus(id, 'rejected', reason);
    }
}

function updateReportStatus(id, status, response) {
    const saved = localStorage.getItem('supply_reports');
    let reports = saved ? JSON.parse(saved) : [];
    
    const index = reports.findIndex(r => r.id === id);
    if (index !== -1) {
        reports[index].status = status;
        reports[index].response = response;
        reports[index].respondedBy = session.name;
        reports[index].respondedAt = new Date().toISOString();
    }
    
    localStorage.setItem('supply_reports', JSON.stringify(reports));
    renderAdminReports();
}

function assignRouteTo(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;
    
    // Pre-seleccionar operador
    showRouteModal();
    
    setTimeout(() => {
        const select = document.getElementById('routeOperator');
        if (select) {
            select.value = employeeId;
        }
    }, 100);
}

function showRouteModal() {
    const modal = document.getElementById('routeModal');
    const operatorSelect = document.getElementById('routeOperator');
    const vehicleSelect = document.getElementById('routeVehicle');
    
    // Llenar operadores
    const operators = employees.filter(e => e.role === 'operator' && e.status === 'active');
    operatorSelect.innerHTML = '<option value="">Seleccionar Operador</option>' + 
        operators.map(o => `<option value="${o.id}">${o.name}</option>`).join('');
    
    // Llenar vehiculos disponibles
    const availableVehicles = vehicles.filter(v => v.status === 'available');
    vehicleSelect.innerHTML = '<option value="">Seleccionar Vehiculo</option>' + 
        availableVehicles.map(v => `<option value="${v.id}">${v.id} - ${v.type}</option>`).join('');
    
    modal.classList.add('active');
}

function closeRouteModal() {
    document.getElementById('routeModal').classList.remove('active');
    document.getElementById('routeForm').reset();
}

function addStop() {
    const container = document.getElementById('stopsContainer');
    const div = document.createElement('div');
    div.className = 'stop-item';
    div.innerHTML = `
        <input type="text" class="stop-address" placeholder="Direccion de parada">
        <input type="text" class="stop-client" placeholder="Cliente">
        <button type="button" class="btn-remove-stop" onclick="removeStop(this)">X</button>
    `;
    container.appendChild(div);
}

function removeStop(btn) {
    btn.closest('.stop-item').remove();
}

function setupFilters() {
    document.getElementById('searchEmp')?.addEventListener('input', renderEmployees);
    document.getElementById('filterRole')?.addEventListener('change', renderEmployees);
    document.getElementById('adminReportFilter')?.addEventListener('change', renderAdminReports);
}

function setupForms() {
    document.getElementById('employeeForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const id = document.getElementById('empId').value;
        const data = {
            id: id || 'EMP' + String(employees.length + 1).padStart(3, '0'),
            name: document.getElementById('empName').value,
            email: document.getElementById('empEmail').value,
            password: document.getElementById('empPassword').value,
            role: document.getElementById('empRole').value,
            status: document.getElementById('empStatus').value
        };
        
        if (id) {
            const index = employees.findIndex(e => e.id === id);
            if (index !== -1) employees[index] = data;
        } else {
            employees.push(data);
        }
        
        employeesDatabase = employees;
        renderEmployees();
        closeModal();
    });
    
    document.getElementById('routeForm')?.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const operatorId = document.getElementById('routeOperator').value;
        const vehicleId = document.getElementById('routeVehicle').value;
        const operator = employees.find(e => e.id === operatorId);
        
        // Recopilar paradas
        const stops = [];
        document.querySelectorAll('.stop-item').forEach(item => {
            const address = item.querySelector('.stop-address').value;
            const client = item.querySelector('.stop-client').value;
            if (address && client) {
                stops.push({ address, client, completed: false });
            }
        });
        
        const newRoute = {
            id: 'R' + Date.now(),
            origin: document.getElementById('routeOrigin').value,
            destination: document.getElementById('routeDestination').value,
            distance: parseInt(document.getElementById('routeDistance').value),
            eta: document.getElementById('routeETA').value,
            status: 'pending',
            progress: 0,
            assignedTo: operatorId,
            operatorName: operator.name,
            vehicleId: vehicleId,
            stops: stops,
            currentLocation: { lat: -12.0464, lng: -77.0428 }, // Lima por defecto
            assignedBy: session.name,
            assignedAt: new Date().toISOString()
        };
        
        routes.push(newRoute);
        localStorage.setItem('supply_routes', JSON.stringify(routes));
        
        // Marcar vehiculo como en uso
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) vehicle.status = 'in-use';
        
        renderRoutes();
        renderFleet();
        renderEmployees();
        updateStats();
        closeRouteModal();
        
        alert('Ruta asignada correctamente a ' + operator.name);
    });
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
            
            document.getElementById('sidebar').classList.remove('active');
            
            if (page === 'reports') renderAdminReports();
        });
    });
}

function editEmployee(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    
    document.getElementById('modalTitle').textContent = 'Editar Empleado';
    document.getElementById('empId').value = emp.id;
    document.getElementById('empName').value = emp.name;
    document.getElementById('empEmail').value = emp.email;
    document.getElementById('empPassword').value = emp.password;
    document.getElementById('empRole').value = emp.role;
    document.getElementById('empStatus').value = emp.status;
    
    document.getElementById('employeeModal').classList.add('active');
}

function deleteEmployee(id) {
    if (session.role !== 'admin') return;
    if (confirm('Eliminar empleado?')) {
        employees = employees.filter(e => e.id !== id);
        employeesDatabase = employees;
        renderEmployees();
    }
}

function cancelRoute(id) {
    if (confirm('Cancelar esta ruta?')) {
        const index = routes.findIndex(r => r.id === id);
        if (index !== -1) {
            const route = routes[index];
            route.status = 'cancelled';
            
            // Liberar vehiculo
            const vehicle = vehicles.find(v => v.id === route.vehicleId);
            if (vehicle) vehicle.status = 'available';
            
            localStorage.setItem('supply_routes', JSON.stringify(routes));
            renderRoutes();
            renderFleet();
            renderEmployees();
            updateStats();
        }
    }
}

function viewRoute(id) {
    const route = routes.find(r => r.id === id);
    if (route) {
        alert(`Ruta ${route.id}\nOrigen: ${route.origin}\nDestino: ${route.destination}\nOperador: ${route.operatorName}\nProgreso: ${route.progress}%\nEstado: ${route.status}`);
    }
}

function showAddModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Empleado';
    document.getElementById('employeeForm').reset();
    document.getElementById('empId').value = '';
    document.getElementById('employeeModal').classList.add('active');
}

function closeModal() {
    document.getElementById('employeeModal').classList.remove('active');
}

function exportData() {
    const data = JSON.stringify(employees, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'empleados.json';
    a.click();
}

function exportRoutes() {
    const data = JSON.stringify(routes, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rutas.json';
    a.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = ev => {
            try {
                employees = JSON.parse(ev.target.result);
                employeesDatabase = employees;
                renderEmployees();
            } catch (err) {
                alert('Error al importar');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function clearAllData() {
    if (confirm('Esto eliminara todas las rutas y reportes. Continuar?')) {
        localStorage.removeItem('supply_routes');
        localStorage.removeItem('supply_reports');
        routes = [];
        loadRoutes();
        renderRoutes();
        renderActiveRoutes();
        alert('Datos limpiados');
    }
}

document.getElementById('logoutBtn')?.addEventListener('click', logout);

window.showAddModal = showAddModal;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.closeModal = closeModal;
window.assignRouteTo = assignRouteTo;
window.showRouteModal = showRouteModal;
window.closeRouteModal = closeRouteModal;
window.addStop = addStop;
window.removeStop = removeStop;
window.cancelRoute = cancelRoute;
window.viewRoute = viewRoute;
window.approveReport = approveReport;
window.rejectReport = rejectReport;
window.exportData = exportData;
window.exportRoutes = exportRoutes;
window.importData = importData;
window.clearAllData = clearAllData;