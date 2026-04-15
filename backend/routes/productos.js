const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');

/**
 * RUTAS DE PRODUCTOS (Inventario)
 *
 * GET    /api/productos              - Obtener todos
 * GET    /api/productos/:id          - Obtener por ID
 * GET    /api/productos/buscar?q=    - Buscar por nombre/código
 * POST   /api/productos              - Crear
 * PUT    /api/productos/:id          - Actualizar
 * DELETE /api/productos/:id          - Eliminar
 */

// Obtener todos los productos
router.get('/', productosController.obtenerProductos);

// Búsqueda especial (debe ir antes de /:id para no confundir con ID)
router.get('/buscar', productosController.buscarProductos);

// Obtener producto específico
router.get('/:id', productosController.obtenerProductoPorId);

// Crear producto
router.post('/', productosController.crearProducto);

// Actualizar producto
router.put('/:id', productosController.actualizarProducto);

// Eliminar producto
router.delete('/:id', productosController.eliminarProducto);

module.exports = router;

