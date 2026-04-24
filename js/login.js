document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');

    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const email = document.getElementById('email').value.trim().toLowerCase();
        const password = document.getElementById('password').value.trim();

        try {
            const response = await fetch('./data/employees.json');

            if (!response.ok) {
                throw new Error('No se pudo cargar employees.json');
            }

            const data = await response.json();
            const employees = data.employees || [];

            if (!Array.isArray(employees)) {
                showError('employees.json no tiene una estructura valida.');
                return;
            }

            const user = employees.find(function (employee) {
                return String(employee.email).toLowerCase() === email &&
                    String(employee.password) === password &&
                    String(employee.status).toLowerCase() === 'active';
            });

            if (!user) {
                showError('Credenciales incorrectas o usuario inactivo.');
                return;
            }

            const sessionUser = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                status: user.status
            };

            localStorage.setItem('supply_session', JSON.stringify(sessionUser));
            localStorage.setItem('supply_employees', JSON.stringify(employees));

            redirectByRole(user.role);

        } catch (error) {
            console.error(error);
            showError('No se pudo iniciar sesion. Revisa la ruta data/employees.json.');
        }
    });

    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.style.display = 'block';
        } else {
            alert(message);
        }
    }
});

function redirectByRole(role) {
    const adminRoles = ['admin', 'manager', 'supervisor', 'support', 'logistics'];
    const operatorRoles = ['operator'];

    if (adminRoles.includes(role)) {
        window.location.href = 'admin.html';
        return;
    }

    if (operatorRoles.includes(role)) {
        window.location.href = 'dashboard.html';
        return;
    }

    alert('Rol no reconocido: ' + role);
}