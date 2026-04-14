// Base de datos de empleados (40 empleados de prueba)
const employeesDatabase = [
    // Administradores (3)
    { id: "EMP001", email: "admin@supplytransport.com", password: "admin123", name: "Administrador Sistema", role: "admin", department: "TI", status: "active" },
    { id: "EMP002", email: "admin2@supplytransport.com", password: "admin456", name: "Administrador Secundario", role: "admin", department: "TI", status: "active" },
    { id: "EMP003", email: "sistemas@supplytransport.com", password: "sys789", name: "Ingeniero Sistemas", role: "admin", department: "TI", status: "active" },
    
    // Gerentes (5)
    { id: "EMP004", email: "gerente@supplytransport.com", password: "manager123", name: "Gerente Operaciones", role: "manager", department: "Operaciones", status: "active" },
    { id: "EMP005", email: "gerente.logistica@supplytransport.com", password: "log456", name: "Gerente Logistica", role: "manager", department: "Logistica", status: "active" },
    { id: "EMP006", email: "gerente.comercial@supplytransport.com", password: "com789", name: "Gerente Comercial", role: "manager", department: "Comercial", status: "active" },
    { id: "EMP007", email: "gerente.rrhh@supplytransport.com", password: "rrhh123", name: "Gerente RRHH", role: "manager", department: "Recursos Humanos", status: "active" },
    { id: "EMP008", email: "gerente.finanzas@supplytransport.com", password: "fin456", name: "Gerente Finanzas", role: "manager", department: "Finanzas", status: "active" },
    
    // Supervisores (7)
    { id: "EMP009", email: "supervisor@supplytransport.com", password: "super123", name: "Supervisor Flota", role: "supervisor", department: "Logistica", status: "active" },
    { id: "EMP010", email: "supervisor.operaciones@supplytransport.com", password: "oper456", name: "Supervisor Operaciones", role: "supervisor", department: "Operaciones", status: "active" },
    { id: "EMP011", email: "supervisor.almacen@supplytransport.com", password: "alm789", name: "Supervisor Almacen", role: "supervisor", department: "Almacen", status: "active" },
    { id: "EMP012", email: "supervisor.rutas@supplytransport.com", password: "rut123", name: "Supervisor Rutas", role: "supervisor", department: "Logistica", status: "active" },
    { id: "EMP013", email: "supervisor.calidad@supplytransport.com", password: "cal456", name: "Supervisor Calidad", role: "supervisor", department: "Calidad", status: "active" },
    { id: "EMP014", email: "supervisor.mantenimiento@supplytransport.com", password: "man789", name: "Supervisor Mantenimiento", role: "supervisor", department: "Mantenimiento", status: "active" },
    { id: "EMP015", email: "supervisor.turno.noche@supplytransport.com", password: "noc123", name: "Supervisor Turno Noche", role: "supervisor", department: "Operaciones", status: "active" },
    
    // Empleados/Operadores (25)
    { id: "EMP016", email: "empleado1@supplytransport.com", password: "emp123", name: "Juan Perez Lopez", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP017", email: "empleado2@supplytransport.com", password: "emp456", name: "Carlos Ruiz Garcia", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP018", email: "empleado3@supplytransport.com", password: "emp789", name: "Luis Garcia Martinez", role: "operator", department: "Logistica", status: "active" },
    { id: "EMP019", email: "empleado4@supplytransport.com", password: "emp012", name: "Miguel Angel Torres", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP020", email: "empleado5@supplytransport.com", password: "emp345", name: "Jose Ramirez Soto", role: "operator", department: "Almacen", status: "active" },
    { id: "EMP021", email: "empleado6@supplytransport.com", password: "emp678", name: "Francisco Morales Diaz", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP022", email: "empleado7@supplytransport.com", password: "emp901", name: "Antonio Castro Vega", role: "operator", department: "Logistica", status: "active" },
    { id: "EMP023", email: "empleado8@supplytransport.com", password: "emp234", name: "Manuel Jimenez Rios", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP024", email: "empleado9@supplytransport.com", password: "emp567", name: "Roberto Sanchez Cruz", role: "operator", department: "Almacen", status: "active" },
    { id: "EMP025", email: "empleado10@supplytransport.com", password: "emp890", name: "Ricardo Fernandez Luna", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP026", email: "empleado11@supplytransport.com", password: "emp111", name: "Alejandro Mendez Paz", role: "operator", department: "Logistica", status: "active" },
    { id: "EMP027", email: "empleado12@supplytransport.com", password: "emp222", name: "Javier Ortega Silva", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP028", email: "empleado13@supplytransport.com", password: "emp333", name: "Daniel Herrera Leon", role: "operator", department: "Almacen", status: "active" },
    { id: "EMP029", email: "empleado14@supplytransport.com", password: "emp444", name: "Oscar Navarro Reyes", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP030", email: "empleado15@supplytransport.com", password: "emp555", name: "Raul Delgado Mora", role: "operator", department: "Logistica", status: "active" },
    { id: "EMP031", email: "empleado16@supplytransport.com", password: "emp666", name: "Sergio Vargas Rojas", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP032", email: "empleado17@supplytransport.com", password: "emp777", name: "Hector Guzman Pena", role: "operator", department: "Almacen", status: "active" },
    { id: "EMP033", email: "empleado18@supplytransport.com", password: "emp888", name: "Mario Campos Fuentes", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP034", email: "empleado19@supplytransport.com", password: "emp999", name: "Gabriel Rojas Mendez", role: "operator", department: "Logistica", status: "active" },
    { id: "EMP035", email: "empleado20@supplytransport.com", password: "emp000", name: "Victor Medina Lara", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP036", email: "empleado21@supplytransport.com", password: "emp121", name: "Eduardo Paredes Solis", role: "operator", department: "Almacen", status: "active" },
    { id: "EMP037", email: "empleado22@supplytransport.com", password: "emp232", name: "Fernando Cardenas Gil", role: "operator", department: "Operaciones", status: "active" },
    { id: "EMP038", email: "empleado23@supplytransport.com", password: "emp343", name: "Alberto Fuentes Leon", role: "operator", department: "Logistica", status: "active" },
    { id: "EMP039", email: "empleado24@supplytransport.com", password: "emp454", name: "Enrique Rosales Mejia", role: "operator", department: "Operaciones", status: "inactive" },
    { id: "EMP040", email: "empleado25@supplytransport.com", password: "emp565", name: "Arturo Quintana Rios", role: "operator", department: "Almacen", status: "active" }
];

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    // Verificar si hay sesion guardada
    checkSavedSession();
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        
        // Validar credenciales
        const employee = validateCredentials(email, password);
        
        if (employee) {
            if (employee.status !== 'active') {
                showError('Su cuenta esta inactiva. Contacte al administrador.');
                return;
            }
            
            // Crear sesion
            createSession(employee, remember);
            
            // Redirigir segun rol
            redirectBasedOnRole(employee.role);
        } else {
            showError('Correo o contrasena incorrectos');
        }
    });
});

function validateCredentials(email, password) {
    return employeesDatabase.find(emp => 
        emp.email.toLowerCase() === email.toLowerCase() && 
        emp.password === password
    );
}

function createSession(employee, remember) {
    const sessionData = {
        id: employee.id,
        email: employee.email,
        name: employee.name,
        role: employee.role,
        department: employee.department,
        loginTime: new Date().toISOString()
    };
    
    if (remember) {
        localStorage.setItem('supply_transport_session', JSON.stringify(sessionData));
    } else {
        sessionStorage.setItem('supply_transport_session', JSON.stringify(sessionData));
    }
}

function redirectBasedOnRole(role) {
    if (role === 'admin' || role === 'manager') {
        window.location.href = 'admin.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

function checkSavedSession() {
    const session = localStorage.getItem('supply_transport_session') || 
                   sessionStorage.getItem('supply_transport_session');
    
    if (session) {
        const sessionData = JSON.parse(session);
        const loginTime = new Date(sessionData.loginTime);
        const now = new Date();
        const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
            // Sesion valida, redirigir
            redirectBasedOnRole(sessionData.role);
        }
    }
}

// Funcion para cerrar sesion (global)
function logout() {
    localStorage.removeItem('supply_transport_session');
    sessionStorage.removeItem('supply_transport_session');
    window.location.href = 'login.html';
}

// Verificar sesion en paginas protegidas
function checkSession() {
    const session = localStorage.getItem('supply_transport_session') || 
                   sessionStorage.getItem('supply_transport_session');
    
    if (!session) {
        window.location.href = 'login.html';
        return null;
    }
    
    const sessionData = JSON.parse(session);
    const loginTime = new Date(sessionData.loginTime);
    const now = new Date();
    const hoursDiff = (now - loginTime) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
        logout();
        return null;
    }
    
    return sessionData;
}