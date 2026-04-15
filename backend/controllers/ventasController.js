const db = require('../database');

// Obtener todas las ventas (con manejo de errores)
exports.obtenerVentas = (req, res) => {
    const sql = "SELECT * FROM ventas ORDER BY id DESC";

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error al leer ventas:", err.message);
            // No le damos detalles técnicos al usuario por seguridad
            return res.status(500).json({ error: "Error interno al obtener el historial." });
        }
        res.json({ data: rows });
    });
};

// Crear una venta (Blindado contra datos incorrectos)
exports.crearVenta = (req, res) => {
    // 1. Desestructuración segura
    let { producto, cantidad, precio } = req.body;

    // 2. VALIDACIÓN DE DATOS (Backend - Última línea de defensa)

    // Validar Producto
    if (!producto || typeof producto !== 'string' || producto.trim() === '') {
        return res.status(400).json({ error: "El nombre del producto es obligatorio." });
    }

    // Validar Cantidad (Convertir a entero por seguridad y validar lógica)
    cantidad = parseInt(cantidad);
    if (isNaN(cantidad) || cantidad <= 0) {
        return res.status(400).json({ error: "La cantidad debe ser un número entero mayor a 0." });
    }

    // Validar Precio (Convertir a flotante y validar que no sea negativo)
    precio = parseFloat(precio);
    if (isNaN(precio) || precio < 0) {
        return res.status(400).json({ error: "El precio no puede ser negativo ni texto." });
    }

    // 3. INSERCIÓN SEGURA (Prepared Statements)
    // Usamos '?' para prevenir inyección SQL. Nunca concatenar strings aquí.
    const sql = `INSERT INTO ventas (producto, cantidad, precio, fecha) VALUES (?, ?, ?, date('now', 'localtime'))`;
    const params = [producto.trim(), cantidad, precio];

    db.run(sql, params, function (err) {
        if (err) {
            console.error("Error al insertar venta:", err.message);
            return res.status(500).json({ error: "Error al guardar la venta en la base de datos." });
        }

        // 4. RESPUESTA DE ÉXITO (HTTP 201 Created)
        res.status(201).json({
            message: "Venta registrada con éxito",
            venta: {
                id: this.lastID,
                producto: producto.trim(),
                cantidad,
                precio,
                fecha: new Date().toLocaleDateString() // Fecha simulada para feedback inmediato
            }
        });
    });
};