const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Ruta del archivo de BD
const dbPath = path.join(__dirname, "pos.db");

// Crear o abrir BD
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("Error al abrir BD:", err.message);
    } else {
        console.log("Base de datos conectada");
    }
});

// Crear tablas
db.serialize(() => {

    db.run(`
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT,
      total REAL
    )
  `);

    db.run(`
    CREATE TABLE IF NOT EXISTS detalle_ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER,
      producto TEXT,
      precio REAL,
      cantidad INTEGER,
      subtotal REAL
    )
  `);

});

module.exports = db;
