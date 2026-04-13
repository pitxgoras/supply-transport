// Configuracion de Supabase
const SUPABASE_CONFIG = {
    url: 'https://tu-proyecto.supabase.co',
    anonKey: 'tu-clave-anon-publica',
    
    // Tablas
    tables: {
        employees: 'employees',
        vehicles: 'vehicles',
        shipments: 'shipments',
        routes: 'routes',
        clients: 'clients',
        documents: 'documents'
    },
    
    // Storage buckets
    buckets: {
        documents: 'employee-documents',
        photos: 'vehicle-photos',
        reports: 'reports'
    }
};

// Esquema de la base de datos
const DATABASE_SCHEMA = {
    employees: `
        CREATE TABLE employees (
            id VARCHAR(20) PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) NOT NULL,
            department VARCHAR(100),
            permissions JSONB,
            status VARCHAR(20) DEFAULT 'active',
            hire_date DATE,
            last_access TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `,
    
    vehicles: `
        CREATE TABLE vehicles (
            id VARCHAR(20) PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            plate VARCHAR(20) UNIQUE NOT NULL,
            brand VARCHAR(50),
            model VARCHAR(50),
            year INTEGER,
            capacity DECIMAL(10,2),
            status VARCHAR(20) DEFAULT 'available',
            assigned_to VARCHAR(20) REFERENCES employees(id),
            last_service DATE,
            next_service DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `,
    
    shipments: `
        CREATE TABLE shipments (
            id VARCHAR(20) PRIMARY KEY,
            client_id VARCHAR(20) REFERENCES clients(id),
            origin VARCHAR(255) NOT NULL,
            destination VARCHAR(255) NOT NULL,
            vehicle_id VARCHAR(20) REFERENCES vehicles(id),
            driver_id VARCHAR(20) REFERENCES employees(id),
            status VARCHAR(20) DEFAULT 'pending',
            scheduled_date DATE,
            delivery_date DATE,
            weight DECIMAL(10,2),
            volume DECIMAL(10,2),
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `
};

// Politicas de seguridad (Row Level Security)
const SECURITY_POLICIES = {
    employees: `
        -- Solo administradores pueden ver todos los empleados
        CREATE POLICY "Admins can view all employees" ON employees
            FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
            
        -- Empleados pueden ver su propio perfil
        CREATE POLICY "Employees can view own profile" ON employees
            FOR SELECT USING (email = auth.jwt() ->> 'email');
    `,
    
    shipments: `
        -- Gerentes y supervisores pueden ver todos los envios
        CREATE POLICY "Managers can view all shipments" ON shipments
            FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'manager', 'supervisor'));
            
        -- Operadores solo ven sus envios asignados
        CREATE POLICY "Drivers can view assigned shipments" ON shipments
            FOR SELECT USING (driver_id = auth.jwt() ->> 'employee_id');
    `
};

export { SUPABASE_CONFIG, DATABASE_SCHEMA, SECURITY_POLICIES };