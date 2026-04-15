const express = require("express");
const router = express.Router();
const ventasController = require("../controllers/ventasController");

/**
 * RUTAS DE VENTAS (Transaccionales)
 *
 * GET    /api/ventas                     - Obtener todas
 * GET    /api/ventas/:id                 - Obtener venta con detalles
 * POST   /api/ventas                     - Crear venta (con transacción)
 * GET    /api/ventas/reportes/resumen    - Resumen del día
 * GET    /api/ventas/reportes/productos  - Productos más vendidos
 */

// Obtener todas las ventas
router.get("/", ventasController.obtenerVentas);

// Resumen de ventas del día (debe ir antes de /:id)
router.get("/reportes/resumen", ventasController.obtenerResumenVentasDia);

// Productos más vendidos (debe ir antes de /:id)
router.get("/reportes/productos", ventasController.obtenerProductosMasVendidos);

// Obtener venta específica con detalles
router.get("/:id", ventasController.obtenerVentaPorId);

// Crear nueva venta (con transacción SQL)
router.post("/", ventasController.crearVenta);

module.exports = router;

