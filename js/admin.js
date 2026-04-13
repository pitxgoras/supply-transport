// Funcionalidad del Panel Administrativo
document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
    
    // Navegacion del admin
    const navItems = document.querySelectorAll('.admin-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            const pageId = this.getAttribute('data-page');
            showAdminPage(pageId);
        });
    });
    
    // Filtros
    const searchInput = document.getElementById('searchEmployee');
    const filterSelect = document.getElementById('filterDepartment');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterEmployees);
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterEmployees);
    }
});

function initializeAdmin() {
    const session = checkSession();
    if (session && session.role === 'admin') {
        displayAdminInfo(session);
        loadAdminData();
    } else {
        window.location.href = '/dashboard.html';
    }
}

function displayAdminInfo(session) {
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => el.textContent = session.name);
}

function showAdminPage(pageId) {
    const pages = document.querySelectorAll('.admin-page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.add('active');
        loadAdminPageData(pageId);
    }
}

function loadAdminData() {
    loadEmployeesData();
}

function loadAdminPageData(pageId) {
    switch(pageId) {
        case 'empleados':
            loadEmployeesData();
            break;
        case 'vehiculos':
            loadVehiclesData();
            break;
        case 'clientes':
            loadClientsData();
            break;
        case 'reportes':
            loadAdminReports();
            break;
        case 'configuracion':
            loadConfiguration();
            break;
    }
}

function loadEmployeesData() {
    // Cargar datos de empleados
    console.log('Cargando datos de empleados...');
}

function loadVehiclesData() {
    // Cargar datos de vehiculos
    console.log('Cargando datos de flota...');
}

function loadClientsData() {
    // Cargar datos de clientes
    console.log('Cargando datos de clientes...');
}

function loadAdminReports() {
    // Cargar reportes administrativos
    console.log('Cargando reportes administrativos...');
}

function loadConfiguration() {
    // Cargar configuracion
    console.log('Cargando configuracion...');
}

function filterEmployees() {
    const searchTerm = document.getElementById('searchEmployee').value.toLowerCase();
    const department = document.getElementById('filterDepartment').value;
    
    const rows = document.querySelectorAll('#employeesTable tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matchesSearch = text.includes(searchTerm);
        const matchesDept = !department || text.includes(department);
        
        if (matchesSearch && matchesDept) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function addEmployee() {
    // Abrir modal para agregar empleado
    alert('Funcionalidad para agregar empleado');
}

function exportData() {
    // Exportar datos a CSV
    alert('Exportando datos...');
}

// Funciones de utilidad para admin
function editEmployee(employeeId) {
    console.log('Editando empleado:', employeeId);
}

function deleteEmployee(employeeId) {
    if (confirm('Esta seguro de eliminar este empleado?')) {
        console.log('Eliminando empleado:', employeeId);
    }
}

function editVehicle(vehicleId) {
    console.log('Editando vehiculo:', vehicleId);
}

function serviceVehicle(vehicleId) {
    console.log('Registrando servicio para vehiculo:', vehicleId);
}

// Exportar funciones globales
window.addEmployee = addEmployee;
window.exportData = exportData;
window.editEmployee = editEmployee;
window.deleteEmployee = deleteEmployee;
window.editVehicle = editVehicle;
window.serviceVehicle = serviceVehicle;