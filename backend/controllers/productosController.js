const db = require('../database');

/**
 * CONTROLADOR DE PRODUCTOS (Articulos v2.0)
 * Gestiona todas las operaciones CRUD para el inventario
 * Consulta tabla 'articulos' en lugar de 'productos'
 */

/**
 * GET /api/productos
 * Obtiene todos los artículos del inventario
 */
exports.obtenerProductos = (req, res) => {
    const sql = `
        SELECT 
            id_articulo, 
            codigo_barras, 
            nombre, 
            precio_venta,
            stock,
            tipo_item,
            permite_precio_variable,
            fecha_creacion
        FROM articulos 
        ORDER BY nombre ASC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Error al obtener artículos:', err.message);
            return res.status(500).json({ 
                error: 'Error al obtener el inventario.' 
            });
        }
        res.json({ data: rows || [] });
    });
};

/**
 * GET /api/productos/:id
 * Obtiene un artículo específico por ID
 */
exports.obtenerProductoPorId = (req, res) => {
    const { id } = req.params;

    // Validación: ID debe ser número
    if (isNaN(id) || parseInt(id) <= 0) {
        return res.status(400).json({ 
            error: 'El ID del artículo debe ser un número válido.' 
        });
    }

    const sql = `
        SELECT 
            id_articulo, 
            codigo_barras, 
            nombre, 
            precio_venta,
            stock,
            tipo_item,
            permite_precio_variable,
            fecha_creacion
        FROM articulos 
        WHERE id_articulo = ?
    `;

    db.get(sql, [parseInt(id)], (err, row) => {
        if (err) {
            console.error('❌ Error al obtener artículo:', err.message);
            return res.status(500).json({ 
                error: 'Error al obtener el artículo.' 
            });
        }

        if (!row) {
            return res.status(404).json({ 
                error: 'Artículo no encontrado.' 
            });
        }

        res.json({ data: row });
    });
};

/**
 * POST /api/productos
 * Crea un nuevo artículo en el inventario
 *
 * Body requerido:
 * {
 *   "codigo_barras": "SKU123",
 *   "nombre": "Lápiz HB",
 *   "precio_venta": 0.50,
 *   "stock": 100,
 *   "tipo_item": "tangible",
 *   "permite_precio_variable": 0
 * }
 */
exports.crearProducto = (req, res) => {
    let { codigo_barras, nombre, precio_venta, stock, tipo_item, permite_precio_variable } = req.body;

    // ...existing code...

    // Validar precio_venta
    precio_venta = parseFloat(precio_venta);
    if (isNaN(precio_venta) || precio_venta <= 0) {
        return res.status(400).json({
            error: 'El precio_venta debe ser un número mayor a 0.'
        });
    }

    // ...existing code...

    // tipo_item debe ser válido
    tipo_item = tipo_item || 'tangible';
    if (!['tangible', 'servicio_rapido', 'tramite'].includes(tipo_item)) {
        return res.status(400).json({
            error: 'tipo_item debe ser: tangible, servicio_rapido o tramite'
        });
    }

    // permite_precio_variable debe ser 0 o 1
    permite_precio_variable = permite_precio_variable ? 1 : 0;

    // ========== INSERCIÓN SEGURA (Prepared Statements) ==========
    const sql = `
        INSERT INTO articulos (codigo_barras, nombre, precio_venta, stock, tipo_item, permite_precio_variable)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [codigo_barras, nombre, precio_venta, stock, tipo_item, permite_precio_variable], function(err) {
        if (err) {
            console.error('❌ Error al insertar artículo:', err.message);

            // Manejar error de unicidad en código de barras
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ 
                    error: 'Ya existe un artículo con este código de barras.'
                });
            }

            return res.status(500).json({ 
                error: 'Error al guardar el artículo.'
            });
        }

        res.status(201).json({
            message: 'Artículo creado exitosamente',
            producto: {
                id_articulo: this.lastID,
                codigo_barras,
                nombre,
                precio_venta,
                stock,
                tipo_item,
                permite_precio_variable,
                fecha_creacion: new Date().toISOString()
            }
        });
    });
};

/**
 * PUT /api/productos/:id
 * Actualiza un artículo existente
 *
 * Body esperado (campos opcionales):
 * {
 *   "codigo_barras": "SKU123_NEW",
 *   "nombre": "Lápiz HB - Nuevo",
 *   "precio_venta": 0.60,
 *   "stock": 150,
 *   "tipo_item": "tangible",
 *   "permite_precio_variable": 0
 * }
 */
exports.actualizarProducto = (req, res) => {
    const { id } = req.params;
    let { codigo_barras, nombre, precio_venta, stock, tipo_item, permite_precio_variable } = req.body;

    // Validar ID
    if (isNaN(id) || parseInt(id) <= 0) {
        return res.status(400).json({ 
            error: 'El ID del artículo debe ser un número válido.'
        });
    }

    // ========== VALIDACIÓN DE CAMPOS ==========
    const actualizaciones = {};

    if (nombre !== undefined) {
        if (typeof nombre !== 'string' || nombre.trim() === '') {
            return res.status(400).json({ 
                error: 'El nombre debe ser texto no vacío.' 
            });
        }
        actualizaciones.nombre = nombre.trim();
    }

    if (precio_venta !== undefined) {
        precio_venta = parseFloat(precio_venta);
        if (isNaN(precio_venta) || precio_venta <= 0) {
            return res.status(400).json({
                error: 'El precio_venta debe ser un número mayor a 0.'
            });
        }
        actualizaciones.precio_venta = precio_venta;
    }

    if (stock !== undefined) {
        stock = parseInt(stock);
        if (isNaN(stock) || stock < 0) {
            return res.status(400).json({ 
                error: 'El stock debe ser un número no negativo.' 
            });
        }
        actualizaciones.stock = stock;
    }

    if (tipo_item !== undefined) {
        if (!['tangible', 'servicio_rapido', 'tramite'].includes(tipo_item)) {
            return res.status(400).json({
                error: 'tipo_item debe ser: tangible, servicio_rapido o tramite'
            });
        }
        actualizaciones.tipo_item = tipo_item;
    }

    if (permite_precio_variable !== undefined) {
        actualizaciones.permite_precio_variable = permite_precio_variable ? 1 : 0;
    }

    if (codigo_barras !== undefined) {
        if (codigo_barras === '') {
            actualizaciones.codigo_barras = null;
        } else {
            actualizaciones.codigo_barras = String(codigo_barras).trim();
        }
    }

    // Si no hay nada para actualizar
    if (Object.keys(actualizaciones).length === 0) {
        return res.status(400).json({ 
            error: 'Debes enviar al menos un campo para actualizar.' 
        });
    }

    // ========== CONSTRUIR QUERY DINÁMICAMENTE ==========
    const campos = Object.keys(actualizaciones);
    const valores = Object.values(actualizaciones);
    const setClauses = campos.map(campo => `${campo} = ?`).join(', ');

    const sql = `UPDATE articulos SET ${setClauses} WHERE id_articulo = ?`;
    valores.push(parseInt(id));

    db.run(sql, valores, function(err) {
        if (err) {
            console.error('❌ Error al actualizar artículo:', err.message);

            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ 
                    error: 'Ya existe un artículo con este código de barras.'
                });
            }

            return res.status(500).json({ 
                error: 'Error al actualizar el artículo.'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({ 
                error: 'Artículo no encontrado.'
            });
        }

        res.json({
            message: 'Artículo actualizado exitosamente',
            cambios: this.changes
        });
    });
};

/**
 * DELETE /api/productos/:id
 * Elimina un artículo del inventario
 */
exports.eliminarProducto = (req, res) => {
    const { id } = req.params;

    // Validar ID
    if (isNaN(id) || parseInt(id) <= 0) {
        return res.status(400).json({ 
            error: 'El ID del artículo debe ser un número válido.' 
        });
    }

    // ========== VERIFICAR QUE EXISTE ==========
    db.get(
        'SELECT id_articulo FROM articulos WHERE id_articulo = ?',
        [parseInt(id)],
        (err, row) => {
            if (err) {
                console.error('❌ Error verificando artículo:', err.message);
                return res.status(500).json({ 
                    error: 'Error verificando el artículo.' 
                });
            }

            if (!row) {
                return res.status(404).json({ 
                    error: 'Artículo no encontrado.' 
                });
            }

            // ========== ELIMINAR ==========
            db.run(
                'DELETE FROM articulos WHERE id_articulo = ?',
                [parseInt(id)],
                function(err) {
                    if (err) {
                        console.error('❌ Error al eliminar artículo:', err.message);
                        return res.status(500).json({ 
                            error: 'Error al eliminar el artículo.' 
                        });
                    }

                    res.json({
                        message: 'Artículo eliminado exitosamente',
                        id_articulo: parseInt(id)
                    });
                }
            );
        }
    );
};

/**
 * GET /api/productos/buscar?q=nombre
 * Busca artículos por nombre o código de barras
 */
exports.buscarProductos = (req, res) => {
    const { q } = req.query;

    if (!q || q.trim() === '') {
        return res.status(400).json({ 
            error: 'El parámetro de búsqueda "q" es requerido.' 
        });
    }

    const termino = `%${q.trim()}%`;
    const sql = `
        SELECT 
            id_articulo, 
            codigo_barras, 
            nombre, 
            precio_venta,
            stock,
            tipo_item,
            permite_precio_variable,
            fecha_creacion
        FROM articulos 
        WHERE nombre LIKE ? OR codigo_barras LIKE ?
        ORDER BY nombre ASC
    `;

    db.all(sql, [termino, termino], (err, rows) => {
        if (err) {
            console.error('❌ Error al buscar artículos:', err.message);
            return res.status(500).json({ 
                error: 'Error al buscar artículos.' 
            });
        }

        res.json({ data: rows || [] });
    });
};

