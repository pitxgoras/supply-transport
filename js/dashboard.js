// DASHBOARD FUNCIONALIDAD COMPLETA

let currentSession = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar sesion
    currentSession = checkSession();
    
    if (!currentSession) {
        window.location.href = 'login.html';
        return;
    }
    
    // Verificar que no sea admin/manager (ellos van a admin.html)
    if (currentSession.role === 'admin' || currentSession.role === 'manager') {
        window.location.href = 'admin.html';
        return;
    }
    
    // Mostrar informacion del usuario
    displayUserInfo(currentSession);
    
    // Inicializar dashboard
    initializeDashboard();
    
    // Actualizar fecha/hora
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Configurar navegacion
    setupDashboardNavigation();
});

function initializeDashboard() {
    console.log('Dashboard inicializado para:', currentSession.name);
}

function setupDashboardNavigation() {
    const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            const pageId = this.getAttribute('data-page');
            showDashboardPage(pageId);
        });
    });
}

function showDashboardPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.add('active');
    }
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

// Hacer funciones disponibles globalmente
window.showDashboardPage = showDashboardPage;