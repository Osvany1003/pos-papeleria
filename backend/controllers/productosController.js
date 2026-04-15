const db = require('../database');

/**
 * CONTROLADOR DE PRODUCTOS
 * Gestiona todas las operaciones CRUD para el inventario
 */

/**
 * GET /api/productos
 * Obtiene todos los productos del inventario
 */
exports.obtenerProductos = (req, res) => {
    const sql = `
        SELECT 
            id_producto, 
            codigo_barras, 
            nombre, 
            precio, 
            stock, 
            fecha_creacion
        FROM productos 
        ORDER BY nombre ASC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Error al obtener productos:', err.message);
            return res.status(500).json({ 
                error: 'Error al obtener el inventario.' 
            });
        }
        res.json({ data: rows || [] });
    });
};

/**
 * GET /api/productos/:id
 * Obtiene un producto específico por ID
 */
exports.obtenerProductoPorId = (req, res) => {
    const { id } = req.params;

    // Validación: ID debe ser número
    if (isNaN(id) || parseInt(id) <= 0) {
        return res.status(400).json({ 
            error: 'El ID del producto debe ser un número válido.' 
        });
    }

    const sql = `
        SELECT 
            id_producto, 
            codigo_barras, 
            nombre, 
            precio, 
            stock, 
            fecha_creacion
        FROM productos 
        WHERE id_producto = ?
    `;

    db.get(sql, [parseInt(id)], (err, row) => {
        if (err) {
            console.error('❌ Error al obtener producto:', err.message);
            return res.status(500).json({ 
                error: 'Error al obtener el producto.' 
            });
        }

        if (!row) {
            return res.status(404).json({ 
                error: 'Producto no encontrado.' 
            });
        }

        res.json({ data: row });
    });
};

/**
 * POST /api/productos
 * Crea un nuevo producto en el inventario
 * 
 * Body requerido:
 * {
 *   "codigo_barras": "SKU123",
 *   "nombre": "Lápiz HB",
 *   "precio": 0.50,
 *   "stock": 100
 * }
 */
exports.crearProducto = (req, res) => {
    let { codigo_barras, nombre, precio, stock } = req.body;

    // ========== VALIDACIÓN ROBUSTA ==========

    // Validar nombre
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({ 
            error: 'El nombre del producto es obligatorio y debe ser texto.' 
        });
    }
    nombre = nombre.trim();

    // Validar precio
    precio = parseFloat(precio);
    if (isNaN(precio) || precio <= 0) {
        return res.status(400).json({ 
            error: 'El precio debe ser un número mayor a 0.' 
        });
    }

    // Validar stock
    stock = parseInt(stock);
    if (isNaN(stock) || stock < 0) {
        return res.status(400).json({ 
            error: 'El stock debe ser un número no negativo.' 
        });
    }

    // Código de barras (opcional, pero si viene debe ser válido)
    if (codigo_barras) {
        codigo_barras = String(codigo_barras).trim();
        if (codigo_barras === '') {
            codigo_barras = null; // Tratamos vacío como NULL
        }
    } else {
        codigo_barras = null;
    }

    // ========== INSERCIÓN SEGURA (Prepared Statements) ==========
    const sql = `
        INSERT INTO productos (codigo_barras, nombre, precio, stock)
        VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [codigo_barras, nombre, precio, stock], function(err) {
        if (err) {
            console.error('❌ Error al insertar producto:', err.message);
            
            // Manejar error de unicidad en código de barras
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ 
                    error: 'Ya existe un producto con este código de barras.' 
                });
            }

            return res.status(500).json({ 
                error: 'Error al guardar el producto.' 
            });
        }

        res.status(201).json({
            message: 'Producto creado exitosamente',
            producto: {
                id_producto: this.lastID,
                codigo_barras,
                nombre,
                precio,
                stock,
                fecha_creacion: new Date().toISOString()
            }
        });
    });
};

/**
 * PUT /api/productos/:id
 * Actualiza un producto existente
 * 
 * Body esperado (campos opcionales):
 * {
 *   "codigo_barras": "SKU123_NEW",
 *   "nombre": "Lápiz HB - Nuevo",
 *   "precio": 0.60,
 *   "stock": 150
 * }
 */
exports.actualizarProducto = (req, res) => {
    const { id } = req.params;
    let { codigo_barras, nombre, precio, stock } = req.body;

    // Validar ID
    if (isNaN(id) || parseInt(id) <= 0) {
        return res.status(400).json({ 
            error: 'El ID del producto debe ser un número válido.' 
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

    if (precio !== undefined) {
        precio = parseFloat(precio);
        if (isNaN(precio) || precio <= 0) {
            return res.status(400).json({ 
                error: 'El precio debe ser un número mayor a 0.' 
            });
        }
        actualizaciones.precio = precio;
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

    const sql = `UPDATE productos SET ${setClauses} WHERE id_producto = ?`;
    valores.push(parseInt(id));

    db.run(sql, valores, function(err) {
        if (err) {
            console.error('❌ Error al actualizar producto:', err.message);
            
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ 
                    error: 'Ya existe un producto con este código de barras.' 
                });
            }

            return res.status(500).json({ 
                error: 'Error al actualizar el producto.' 
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({ 
                error: 'Producto no encontrado.' 
            });
        }

        res.json({
            message: 'Producto actualizado exitosamente',
            cambios: this.changes
        });
    });
};

/**
 * DELETE /api/productos/:id
 * Elimina un producto del inventario
 * 
 * NOTA: En sistemas reales, considera hacer eliminación lógica (soft delete)
 * en lugar de física, para mantener la integridad de registros históricos.
 */
exports.eliminarProducto = (req, res) => {
    const { id } = req.params;

    // Validar ID
    if (isNaN(id) || parseInt(id) <= 0) {
        return res.status(400).json({ 
            error: 'El ID del producto debe ser un número válido.' 
        });
    }

    // ========== VERIFICAR QUE EXISTE ==========
    db.get(
        'SELECT id_producto FROM productos WHERE id_producto = ?',
        [parseInt(id)],
        (err, row) => {
            if (err) {
                console.error('❌ Error verificando producto:', err.message);
                return res.status(500).json({ 
                    error: 'Error verificando el producto.' 
                });
            }

            if (!row) {
                return res.status(404).json({ 
                    error: 'Producto no encontrado.' 
                });
            }

            // ========== ELIMINAR ==========
            db.run(
                'DELETE FROM productos WHERE id_producto = ?',
                [parseInt(id)],
                function(err) {
                    if (err) {
                        console.error('❌ Error al eliminar producto:', err.message);
                        return res.status(500).json({ 
                            error: 'Error al eliminar el producto.' 
                        });
                    }

                    res.json({
                        message: 'Producto eliminado exitosamente',
                        id_producto: parseInt(id)
                    });
                }
            );
        }
    );
};

/**
 * GET /api/productos/buscar?q=nombre
 * Busca productos por nombre o código de barras
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
            id_producto, 
            codigo_barras, 
            nombre, 
            precio, 
            stock, 
            fecha_creacion
        FROM productos 
        WHERE nombre LIKE ? OR codigo_barras LIKE ?
        ORDER BY nombre ASC
    `;

    db.all(sql, [termino, termino], (err, rows) => {
        if (err) {
            console.error('❌ Error al buscar productos:', err.message);
            return res.status(500).json({ 
                error: 'Error al buscar productos.' 
            });
        }

        res.json({ data: rows || [] });
    });
};

