const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/", (req, res) => {

    const { total, productos } = req.body;

    const fecha = new Date().toISOString();

    db.run(
        "INSERT INTO ventas (fecha, total) VALUES (?, ?)",
        [fecha, total],
        function (err) {

            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const ventaId = this.lastID;

            const stmt = db.prepare(`
        INSERT INTO detalle_ventas
        (venta_id, producto, precio, cantidad, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `);

            productos.forEach(p => {
                stmt.run([
                    ventaId,
                    p.producto,
                    p.precio,
                    p.cantidad,
                    p.subtotal
                ]);
            });

            stmt.finalize();

            res.json({ message: "Venta guardada" });
        }
    );

});

module.exports = router;
