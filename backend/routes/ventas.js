const express = require("express");
const router = express.Router();
const ventasController = require("../controllers/ventasController");

// Definimos las rutas y qué función del controlador las atiende
router.get("/", ventasController.obtenerVentas); // Para ver el historial
router.post("/", ventasController.crearVenta);   // Para registrar venta

module.exports = router;