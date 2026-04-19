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
 * Inicializa las tres tablas principales del sistema v2.0:
 * - articulos: Catálogo de artículos (productos y servicios)
 * - ventas: Encabezado de cada transacción
 * - detalles_venta: Líneas de artículos en cada venta
 */
function inicializarTablas() {
    // Tabla 1: ARTICULOS (Inventario v2.0 - Productos y Servicios)
    const sqlArticulos = `
        CREATE TABLE IF NOT EXISTS articulos (
            id_articulo INTEGER PRIMARY KEY AUTOINCREMENT,
            codigo_barras TEXT UNIQUE,
            nombre TEXT NOT NULL,
            precio_venta REAL NOT NULL,
            stock INTEGER NOT NULL DEFAULT 0,
            tipo_item TEXT DEFAULT 'tangible',
            permite_precio_variable INTEGER DEFAULT 0,
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

    // Tabla 3: DETALLES_VENTA (Línea a línea de cada venta v2.0)
    const sqlDetallesVenta = `
        CREATE TABLE IF NOT EXISTS detalles_venta (
            id_detalle INTEGER PRIMARY KEY AUTOINCREMENT,
            id_venta INTEGER NOT NULL,
            id_articulo INTEGER NOT NULL,
            cantidad INTEGER NOT NULL,
            subtotal REAL NOT NULL,
            precio_venta REAL NOT NULL,
            FOREIGN KEY (id_venta) REFERENCES ventas(id_venta),
            FOREIGN KEY (id_articulo) REFERENCES articulos(id_articulo)
        )
    `;

    // Ejecutamos en secuencia
    db.run(sqlArticulos, (err) => {
        if (err) {
            console.error('❌ Error creando tabla articulos:', err.message);
        } else {
            console.log('✅ Tabla "articulos" verificada/creada.');
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