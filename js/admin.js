// PANEL ADMINISTRATIVO - CRUD COMPLETO

let currentSession = null;
let employeesList = [];
let filteredEmployees = [];
let currentPage = 1;
const itemsPerPage = 10;
let employeeToDelete = null;

document.addEventListener('DOMContentLoaded', function() {
    currentSession = checkSession();
    
    if (!currentSession) {
        window.location.href = 'login.html';
        return;
    }
    
    if (currentSession.role !== 'admin' && currentSession.role !== 'manager') {
        alert('Acceso denegado.');
        window.location.href = 'dashboard.html';
        return;
    }
    
    displayUserInfo(currentSession);
    setupAdminPermissions();
    loadEmployees();
    setupNavigation();
    setupEmployeeForm();
    setupFilters();
});

function loadEmployees() {
    // Cargar desde la base de datos global
    if (typeof employeesDatabase !== 'undefined') {
        employeesList = [...employeesDatabase];
    } else {
        // Datos de respaldo
        employeesList = getDefaultEmployees();
    }
    
    filteredEmployees = [...employeesList];
    renderEmployeesTable();
    updatePagination();
    updateCounters();
}

function getDefaultEmployees() {
    return [
        { id: "EMP001", email: "admin@supplytransport.com", password: "admin123", name: "Administrador Sistema", role: "admin", department: "TI", status: "active" },
        { id: "EMP002", email: "gerente@supplytransport.com", password: "manager123", name: "Gerente Operaciones", role: "manager", department: "Operaciones", status: "active" },
        { id: "EMP003", email: "supervisor@supplytransport.com", password: "super123", name: "Supervisor Flota", role: "supervisor", department: "Logistica", status: "active" },
        { id: "EMP004", email: "empleado1@supplytransport.com", password: "emp123", name: "Juan Perez Lopez", role: "operator", department: "Operaciones", status: "active" }
    ];
}

function renderEmployeesTable() {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageEmployees = filteredEmployees.slice(start, end);
    
    if (pageEmployees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">No se encontraron empleados</td></tr>`;
        return;
    }
    
    tbody.innerHTML = '';
    
    pageEmployees.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${emp.id}</strong></td>
            <td>${emp.name}</td>
            <td>${emp.email}</td>
            <td>${emp.department}</td>
            <td>${formatRole(emp.role)}</td>
            <td><span class="status ${emp.status}">${emp.status === 'active' ? 'Activo' : 'Inactivo'}</span></td>
            <td class="action-buttons">
                <button class="btn-edit" onclick="editEmployee('${emp.id}')">Editar</button>
                ${currentSession.role === 'admin' ? 
                    `<button class="btn-delete" onclick="showDeleteModal('${emp.id}')">Eliminar</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updateCounters();
}

function updateCounters() {
    const showingCount = document.getElementById('showingCount');
    const totalCount = document.getElementById('totalCount');
    
    if (showingCount) {
        const start = (currentPage - 1) * itemsPerPage + 1;
        const end = Math.min(start + itemsPerPage - 1, filteredEmployees.length);
        showingCount.textContent = `${start}-${end}`;
    }
    
    if (totalCount) {
        totalCount.textContent = filteredEmployees.length;
    }
}

function updatePagination() {
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Boton anterior
    html += `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>`;
    
    // Numeros de pagina
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span class="page-ellipsis">...</span>`;
        }
    }
    
    // Boton siguiente
    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>`;
    
    pagination.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderEmployeesTable();
    updatePagination();
    
    // Scroll al inicio de la tabla
    document.querySelector('.table-responsive').scrollTop = 0;
}

function setupFilters() {
    const searchInput = document.getElementById('searchEmployee');
    const filterDept = document.getElementById('filterDepartment');
    const filterRole = document.getElementById('filterRole');
    const filterStatus = document.getElementById('filterStatus');
    
    const filterFunction = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const dept = filterDept.value;
        const role = filterRole.value;
        const status = filterStatus.value;
        
        filteredEmployees = employeesList.filter(emp => {
            const matchesSearch = !searchTerm || 
                emp.name.toLowerCase().includes(searchTerm) ||
                emp.email.toLowerCase().includes(searchTerm) ||
                emp.id.toLowerCase().includes(searchTerm);
            
            const matchesDept = !dept || emp.department === dept;
            const matchesRole = !role || emp.role === role;
            const matchesStatus = !status || emp.status === status;
            
            return matchesSearch && matchesDept && matchesRole && matchesStatus;
        });
        
        currentPage = 1;
        renderEmployeesTable();
        updatePagination();
    };
    
    if (searchInput) searchInput.addEventListener('input', filterFunction);
    if (filterDept) filterDept.addEventListener('change', filterFunction);
    if (filterRole) filterRole.addEventListener('change', filterFunction);
    if (filterStatus) filterStatus.addEventListener('change', filterFunction);
}

function setupEmployeeForm() {
    const form = document.getElementById('employeeForm');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const password = document.getElementById('empPassword').value;
        const confirmPassword = document.getElementById('empConfirmPassword').value;
        
        if (password !== confirmPassword) {
            alert('Las contrasenas no coinciden');
            return;
        }
        
        if (password.length < 6) {
            alert('La contrasena debe tener al menos 6 caracteres');
            return;
        }
        
        const employeeId = document.getElementById('employeeId').value;
        const email = document.getElementById('empEmail').value;
        
        // Verificar email duplicado
        const emailExists = employeesList.some(emp => 
            emp.email.toLowerCase() === email.toLowerCase() && emp.id !== employeeId
        );
        
        if (emailExists) {
            alert('El correo electronico ya esta registrado');
            return;
        }
        
        const employeeData = {
            id: employeeId || generateEmployeeId(),
            name: document.getElementById('empName').value,
            email: email,
            password: password,
            department: document.getElementById('empDepartment').value,
            role: document.getElementById('empRole').value,
            status: document.getElementById('empStatus').value,
            phone: document.getElementById('empPhone').value || ''
        };
        
        if (employeeId) {
            const index = employeesList.findIndex(emp => emp.id === employeeId);
            if (index !== -1) {
                employeesList[index] = employeeData;
            }
        } else {
            employeesList.push(employeeData);
        }
        
        // Actualizar base de datos global
        window.employeesDatabase = employeesList;
        
        closeEmployeeModal();
        filteredEmployees = [...employeesList];
        renderEmployeesTable();
        updatePagination();
        alert('Empleado guardado correctamente');
    });
}

function generateEmployeeId() {
    const maxId = employeesList.reduce((max, emp) => {
        const num = parseInt(emp.id.replace('EMP', ''));
        return num > max ? num : max;
    }, 0);
    
    return 'EMP' + String(maxId + 1).padStart(3, '0');
}

function editEmployee(employeeId) {
    const employee = employeesList.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    document.getElementById('modalTitle').textContent = 'Editar Empleado';
    document.getElementById('employeeId').value = employee.id;
    document.getElementById('empName').value = employee.name;
    document.getElementById('empEmail').value = employee.email;
    document.getElementById('empPassword').value = employee.password;
    document.getElementById('empConfirmPassword').value = employee.password;
    document.getElementById('empDepartment').value = employee.department;
    document.getElementById('empRole').value = employee.role;
    document.getElementById('empStatus').value = employee.status;
    document.getElementById('empPhone').value = employee.phone || '';
    
    document.getElementById('employeeModal').style.display = 'block';
}

function showAddEmployeeModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Nuevo Empleado';
    document.getElementById('employeeForm').reset();
    document.getElementById('employeeId').value = '';
    document.getElementById('employeeModal').style.display = 'block';
}

function closeEmployeeModal() {
    document.getElementById('employeeModal').style.display = 'none';
}

function showDeleteModal(employeeId) {
    const employee = employeesList.find(emp => emp.id === employeeId);
    if (!employee) return;
    
    employeeToDelete = employeeId;
    document.getElementById('deleteEmpName').textContent = employee.name;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    employeeToDelete = null;
}

function confirmDelete() {
    if (!employeeToDelete) return;
    
    employeesList = employeesList.filter(emp => emp.id !== employeeToDelete);
    window.employeesDatabase = employeesList;
    filteredEmployees = [...employeesList];
    
    closeDeleteModal();
    renderEmployeesTable();
    updatePagination();
    alert('Empleado eliminado correctamente');
}

function exportData() {
    const dataStr = JSON.stringify(employeesList, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `empleados_backup_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData) && importedData.length > 0) {
                    employeesList = importedData;
                    window.employeesDatabase = employeesList;
                    filteredEmployees = [...employeesList];
                    currentPage = 1;
                    renderEmployeesTable();
                    updatePagination();
                    alert('Datos importados correctamente');
                } else {
                    alert('Formato de archivo invalido');
                }
            } catch (error) {
                alert('Error al leer el archivo');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function setupAdminPermissions() {
    if (currentSession.role === 'manager') {
        const adminOnlyElements = document.querySelectorAll('.admin-only');
        adminOnlyElements.forEach(el => el.style.display = 'none');
    }
}

function setupNavigation() {
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
}

function showAdminPage(pageId) {
    const pages = document.querySelectorAll('.admin-page');
    pages.forEach(page => page.classList.remove('active'));
    
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.add('active');
}

// Hacer funciones globales
window.showAddEmployeeModal = showAddEmployeeModal;
window.editEmployee = editEmployee;
window.showDeleteModal = showDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.closeEmployeeModal = closeEmployeeModal;
window.exportData = exportData;
window.importData = importData;
window.changePage = changePage;