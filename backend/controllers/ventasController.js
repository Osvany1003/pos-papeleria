const db = require("../database");

// Función para obtener todas las ventas (Para el módulo de Reportes)
exports.obtenerVentas = (req, res) => {
    const sql = `
        SELECT v.id, v.fecha, v.total, count(dv.id) as items_count 
        FROM ventas v 
        LEFT JOIN detalle_ventas dv ON v.id = dv.venta_id 
        GROUP BY v.id 
        ORDER BY v.id DESC`;

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// Función para crear una venta con VALIDACIONES
exports.crearVenta = (req, res) => {
    let { total, fecha, items } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: "No hay productos en la venta" });
    }

    // --- VALIDACIÓN Y LIMPIEZA DE DATOS ---
    // Aseguramos tipos de datos correctos antes de guardar
    items = items.map(item => ({
        producto: item.producto.toUpperCase().trim(), // Todo a Mayúsculas y sin espacios extra
        cantidad: Number(item.cantidad),              // Forzar número
        precio: Number(item.precio),                  // Forzar número
        subtotal: Number(item.cantidad) * Number(item.precio) // Recalcular por seguridad
    }));

    // Recalcular total del servidor por seguridad (no confiar solo en el frontend)
    total = items.reduce((sum, item) => sum + item.subtotal, 0);

    // --- INSERCIÓN EN BASE DE DATOS ---
    const sqlVenta = `INSERT INTO ventas (fecha, total) VALUES (?, ?)`;

    db.run(sqlVenta, [fecha, total], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const ventaId = this.lastID;
        const sqlDetalle = `INSERT INTO detalle_ventas (venta_id, producto, cantidad, precio, subtotal) VALUES (?, ?, ?, ?, ?)`;

        // Usamos Promise.all para esperar a que se guarden todos los detalles
        const promesasDetalles = items.map(item => {
            return new Promise((resolve, reject) => {
                db.run(sqlDetalle, [ventaId, item.producto, item.cantidad, item.precio, item.subtotal], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        Promise.all(promesasDetalles)
            .then(() => res.json({ message: "Venta registrada", id: ventaId }))
            .catch(err => res.status(500).json({ error: "Error guardando detalles: " + err.message }));
    });
};