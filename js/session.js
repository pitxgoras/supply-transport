// SCRIPT DE VERIFICACION DE SESION GLOBAL
// Este archivo maneja la autenticacion en todas las paginas protegidas

function checkSession() {
    const session = localStorage.getItem('supply_transport_session') || 
                   sessionStorage.getItem('supply_transport_session');
    
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    
    try {
        const sessionData = JSON.parse(session);
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        // La sesion expira despues de 24 horas
        if (hoursDiff > 24) {
            logout();
            return null;
        }
        
        return sessionData;
    } catch (error) {
        console.error('Error al parsear sesion:', error);
        logout();
        return null;
    }
}

function logout() {
    localStorage.removeItem('supply_transport_session');
    sessionStorage.removeItem('supply_transport_session');
    window.location.href = 'login.html';
}

function displayUserInfo(session) {
    if (!session) return;
    
    // Mostrar nombre de usuario
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        if (el) el.textContent = session.name;
    });
    
    // Mostrar rol formateado
    const userRoleElements = document.querySelectorAll('.user-role');
    userRoleElements.forEach(el => {
        if (el) el.textContent = formatRole(session.role);
    });
    
    // Mostrar departamento
    const userDeptElements = document.querySelectorAll('.user-department');
    userDeptElements.forEach(el => {
        if (el) el.textContent = session.department;
    });
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

// Verificar permisos de administrador
function isAdmin(session) {
    return session && session.role === 'admin';
}

// Verificar permisos de manager o admin
function isManagerOrAdmin(session) {
    return session && (session.role === 'admin' || session.role === 'manager');
}

// Configurar elementos segun permisos
function setupPermissions(session) {
    if (!session) return;
    
    // Si es admin, mostrar elementos admin-only
    if (session.role === 'admin') {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            if (el) el.style.display = 'block';
        });
    }
    
    // Si es manager, ocultar elementos criticos
    if (session.role === 'manager') {
        const criticalElements = document.querySelectorAll('.admin-critical');
        criticalElements.forEach(el => {
            if (el) el.style.display = 'none';
        });
    }
}

// Inicializar boton de logout
function initLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
}

// Verificar acceso a la pagina actual
function checkPageAccess() {
    const session = checkSession();
    
    if (!session) return;
    
    const currentPage = window.location.pathname;
    
    // Verificar acceso a admin.html
    if (currentPage.includes('admin.html')) {
        if (!isManagerOrAdmin(session)) {
            alert('No tiene permisos para acceder al panel administrativo');
            window.location.href = 'dashboard.html';
            return;
        }
    }
    
    // Verificar acceso a dashboard.html
    if (currentPage.includes('dashboard.html')) {
        if (isManagerOrAdmin(session)) {
            window.location.href = 'admin.html';
            return;
        }
    }
    
    // Mostrar informacion del usuario
    displayUserInfo(session);
    
    // Configurar permisos
    setupPermissions(session);
    
    return session;
}

// Ejecutar al cargar la pagina
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar boton de logout
    initLogoutButton();
    
    // Verificar acceso en paginas protegidas
    if (window.location.pathname.includes('dashboard.html') || 
        window.location.pathname.includes('admin.html')) {
        checkPageAccess();
    }
});

// Hacer funciones disponibles globalmente
window.logout = logout;
window.checkSession = checkSession;