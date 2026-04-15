const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Usamos path.resolve para garantizar que siempre encuentre el archivo .db
// sin importar desde dónde se ejecute el servidor
const dbPath = path.resolve(__dirname, 'pos.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Error crítico conectando a la base de datos:', err.message);
        // Opcional: Podrías matar el proceso si no hay DB, pero por ahora solo logueamos
    } else {
        console.log('✅ Conectado a la base de datos SQLite en:', dbPath);
        inicializarTablas();
    }
});

function inicializarTablas() {
    // Aseguramos que la tabla exista. Si se borra el archivo, esto lo regenera automáticamente.
    const sql = `
        CREATE TABLE IF NOT EXISTS ventas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            producto TEXT NOT NULL,
            cantidad INTEGER DEFAULT 1,
            precio REAL NOT NULL,
            fecha TEXT DEFAULT CURRENT_DATE
        )
    `;

    db.run(sql, (err) => {
        if (err) {
            console.error('❌ Error creando la tabla de ventas:', err.message);
        } else {
            console.log('✅ Tabla "ventas" verificada/creada correctamente.');
        }
    });
}

module.exports = db;