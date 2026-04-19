const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Resolvemos la ruta absoluta de la base de datos
const dbPath = path.resolve(__dirname, 'pos.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error crítico conectando a la base de datos:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Conectado a la base de datos SQLite en:', dbPath);
        inicializarTablas();
    }
});

// Habilitamos foreign keys en SQLite
db.run("PRAGMA foreign_keys = ON", (err) => {
    if (err) {
        console.error('❌ Error al habilitar foreign keys:', err.message);
    }
});

/**
 * Inicializa las tres tablas principales del sistema:
 * - productos: Catálogo de artículos con stock
 * - ventas: Encabezado de cada transacción
 * - detalles_venta: Líneas de productos en cada venta
 */
function inicializarTablas() {
    // Tabla 1: PRODUCTOS (Inventario) - Ahora soporta servicios
    const sqlProductos = `
        CREATE TABLE IF NOT EXISTS productos (
            id_producto INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_barras TEXT UNIQUE,
            nombre TEXT NOT NULL,
            precio REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            es_servicio INTEGER DEFAULT 0,
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `;

    // Tabla 2: VENTAS (Encabezado de transacción)
    const sqlVentas = `
        CREATE TABLE IF NOT EXISTS ventas (
            id_venta INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha TEXT DEFAULT CURRENT_TIMESTAMP,
            total REAL NOT NULL
        )
    `;

    // Tabla 3: DETALLES_VENTA (Línea a línea de cada venta - soporta servicios)
    const sqlDetallesVenta = `
        CREATE TABLE IF NOT EXISTS detalles_venta (
            id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
            id_venta INTEGER NOT NULL,
            id_producto INTEGER,
            id_servicio TEXT,
            cantidad INTEGER NOT NULL,
            subtotal REAL NOT NULL,
            FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
            FOREIGN KEY (id_producto) REFERENCES productos(id_producto)
        )
    `;

    // Ejecutamos en secuencia
    db.run(sqlProductos, (err) => {
        if (err) {
            console.error('❌ Error creando tabla productos:', err.message);
        } else {
            console.log('✅ Tabla "productos" verificada/creada.');
        }
    });

    db.run(sqlVentas, (err) => {
        if (err) {
            console.error('❌ Error creando tabla ventas:', err.message);
        } else {
            console.log('✅ Tabla "ventas" verificada/creada.');
        }
    });

    db.run(sqlDetallesVenta, (err) => {
        if (err) {
            console.error('❌ Error creando tabla detalles_venta:', err.message);
        } else {
            console.log('✅ Tabla "detalles_venta" verificada/creada.');
        }
    });
}

module.exports = db;