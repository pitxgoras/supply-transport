// Funcionalidad del Dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Navegacion del dashboard
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase active de todos los items
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar la pagina correspondiente
            const pageId = this.getAttribute('data-page');
            showPage(pageId);
        });
    });
});

function initializeDashboard() {
    const session = checkSession();
    if (session) {
        displayUserInfo(session);
        loadDashboardData(session);
    }
}

function displayUserInfo(session) {
    const userNameElements = document.querySelectorAll('.user-name');
    const userRoleElements = document.querySelectorAll('.user-role');
    const userDeptElements = document.querySelectorAll('.user-department');
    const userAvatar = document.getElementById('userAvatar');
    
    userNameElements.forEach(el => el.textContent = session.name);
    userRoleElements.forEach(el => el.textContent = formatRole(session.role));
    userDeptElements.forEach(el => el.textContent = session.department);
    
    if (userAvatar && session.picture) {
        userAvatar.src = session.picture;
    }
}

function formatRole(role) {
    const roles = {
        'admin': 'Administrador',
        'manager': 'Gerente',
        'supervisor': 'Supervisor',
        'operator': 'Operador'
    };
    return roles[role] || role;
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

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.add('active');
        loadPageData(pageId);
    }
}

function loadPageData(pageId) {
    switch(pageId) {
        case 'overview':
            loadOverviewData();
            break;
        case 'shipments':
            loadShipmentsData();
            break;
        case 'routes':
            loadRoutesData();
            break;
        case 'documents':
            loadDocumentsData();
            break;
        case 'reports':
            loadReportsData();
            break;
    }
}

function loadDashboardData(session) {
    // Cargar datos especificos segun el rol
    if (session.role === 'manager' || session.role === 'admin') {
        loadManagerData();
    }
}

function loadOverviewData() {
    // Simular carga de datos del overview
    console.log('Cargando datos del panel principal...');
}

function loadShipmentsData() {
    // Simular carga de envios
    console.log('Cargando datos de envios...');
}

function loadRoutesData() {
    // Simular carga de rutas
    console.log('Cargando datos de rutas...');
}

function loadDocumentsData() {
    // Simular carga de documentos
    console.log('Cargando documentos...');
}

function loadReportsData() {
    // Simular carga de reportes
    console.log('Cargando reportes...');
}

function loadManagerData() {
    // Datos adicionales para gerentes
    console.log('Cargando datos de gerencia...');
}

// Funciones de utilidad
function formatDate(date) {
    return new Date(date).toLocaleDateString('es-MX');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}

// Exportar funciones
window.showPage = showPage;