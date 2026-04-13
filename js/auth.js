// Configuracion de Supabase
const SUPABASE_URL = 'https://tu-proyecto.supabase.co'; //url_de_tu_proyecto_supabase
const SUPABASE_ANON_KEY = 'tu-clave-anon'; //clave_anonima_de_supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Importar cliente de Supabase

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // Inicializar Supabase

// Base de datos de empleados (simulada)
const employeesDB = {
    "admin@supplytransport.com": {
        name: "Administrador Sistema",
        role: "admin",
        department: "TI",
        employeeId: "EMP001"
    },
    "gerente@supplytransport.com": {
        name: "Gerente Operaciones",
        role: "manager",
        department: "Operaciones",
        employeeId: "EMP002"
    },
    "supervisor@supplytransport.com": {
        name: "Supervisor Flota",
        role: "supervisor",
        department: "Logistica",
        employeeId: "EMP003"
    }
};

// Inicializar Google Sign-In
function initializeGoogleSignIn() {
    google.accounts.id.initialize({
        client_id: 'TU_CLIENT_ID_GOOGLE',
        callback: handleGoogleSignIn,
        auto_select: false
    });

    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            google.accounts.id.prompt();
        });
    }
}

// Manejar inicio de sesion con Google
async function handleGoogleSignIn(response) {
    try {
        const credential = response.credential;
        const userInfo = parseJwt(credential);
        
        // Verificar si el email esta en la base de empleados
        const employee = employeesDB[userInfo.email];
        
        if (employee) {
            // Guardar sesion
            const sessionData = {
                email: userInfo.email,
                name: userInfo.name,
                picture: userInfo.picture,
                role: employee.role,
                department: employee.department,
                employeeId: employee.employeeId,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('supply_transport_session', JSON.stringify(sessionData));
            
            // Redirigir segun rol
            redirectBasedOnRole(employee.role);
        } else {
            alert('Acceso denegado. Solo empleados autorizados.');
            google.accounts.id.disableAutoSelect();
        }
    } catch (error) {
        console.error('Error en autenticacion:', error);
        alert('Error en el proceso de autenticacion');
    }
}

// Decodificar JWT de Google
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
}

// Redireccion segun rol
function redirectBasedOnRole(role) {
    switch(role) {
        case 'admin':
            window.location.href = '/admin.html';
            break;
        case 'manager':
        case 'supervisor':
            window.location.href = '/dashboard.html';
            break;
        default:
            window.location.href = '/dashboard.html';
    }
}

// Verificar sesion activa
function checkSession() {
    const session = localStorage.getItem('supply_transport_session');
    if (!session) {
        window.location.href = '/index.html';
        return null;
    }
    
    const sessionData = JSON.parse(session);
    
    // Verificar si la sesion expiro (24 horas)
    const loginTime = new Date(sessionData.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
        logout();
        return null;
    }
    
    return sessionData;
}

// Cerrar sesion
function logout() {
    localStorage.removeItem('supply_transport_session');
    google.accounts.id.disableAutoSelect();
    window.location.href = '/index.html';
}

// Inicializar en paginas protegidas
if (window.location.pathname.includes('dashboard.html') || 
    window.location.pathname.includes('admin.html')) {
    const session = checkSession();
    if (session) {
        document.addEventListener('DOMContentLoaded', () => {
            displayUserInfo(session);
        });
    }
}

// Mostrar informacion del usuario
function displayUserInfo(session) {
    const userInfoElements = document.querySelectorAll('.user-name');
    userInfoElements.forEach(el => {
        el.textContent = session.name;
    });
    
    const roleElements = document.querySelectorAll('.user-role');
    roleElements.forEach(el => {
        el.textContent = session.role;
    });
}

// Exportar funciones
window.logout = logout;
window.checkSession = checkSession;

// Inicializar cuando el DOM este listo
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('loginBtn')) {
        initializeGoogleSignIn();
    }
});