const db = require('../database');

/**
 * CONTROLADOR DE VENTAS
 * Gestiona el registro de ventas con transacciones SQL
 */

/**
 * GET /api/ventas
 * Obtiene el historial de ventas con sus detalles
 */
exports.obtenerVentas = (req, res) => {
    const sql = `
        SELECT 
            v.id_venta,
            v.fecha,
            v.total,
            COUNT(dv.id_detalle) as cantidad_productos
        FROM ventas v
        LEFT JOIN detalles_venta dv ON v.id_venta = dv.id_venta
        GROUP BY v.id_venta
        ORDER BY v.fecha DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Error al obtener ventas:', err.message);
            return res.status(500).json({
                error: 'Error al obtener el historial de ventas.'
            });
        }
        res.json({ data: rows || [] });
    });
};

/**
 * GET /api/ventas/:id
 * Obtiene una venta específica con todos sus detalles
 */
exports.obtenerVentaPorId = (req, res) => {
    const { id } = req.params;

    if (isNaN(id) || parseInt(id) <= 0) {
        return res.status(400).json({
            error: 'El ID de la venta debe ser un número válido.'
        });
    }

    const sql = `
        SELECT 
            v.id_venta,
            v.fecha,
            v.total,
            dv.id_detalle,
            dv.id_producto,
            p.nombre,
            p.codigo_barras,
            dv.cantidad,
            dv.subtotal
        FROM ventas v
        LEFT JOIN detalles_venta dv ON v.id_venta = dv.id_venta
        LEFT JOIN productos p ON dv.id_producto = p.id_producto
        WHERE v.id_venta = ?
    `;

    db.all(sql, [parseInt(id)], (err, rows) => {
        if (err) {
            console.error('❌ Error al obtener venta:', err.message);
            return res.status(500).json({
                error: 'Error al obtener la venta.'
            });
        }

        if (!rows || rows.length === 0) {
            return res.status(404).json({
                error: 'Venta no encontrada.'
            });
        }

        // Restructuramos la respuesta
        const venta = {
            id_venta: rows[0].id_venta,
            fecha: rows[0].fecha,
            total: rows[0].total,
            detalles: rows.map(row => ({
                id_detalle: row.id_detalle,
                id_producto: row.id_producto,
                nombre_producto: row.nombre,
                codigo_barras: row.codigo_barras,
                cantidad: row.cantidad,
                subtotal: row.subtotal
            })).filter(d => d.id_detalle !== null)
        };

        res.json({ data: venta });
    });
};

/**
 * POST /api/ventas
 *
 * REGLA CRÍTICA: Crea una venta con transacción SQL
 * Soporta productos e servicios (sin inventario)
 * 
 * 1. Valida stock disponible (solo para productos, no servicios)
 * 2. Inicia transacción
 * 3. Inserta venta
 * 4. Inserta detalles
 * 5. Actualiza stock (solo para productos, no servicios)
 * 6. Commit o Rollback según errores
 *
 * Body esperado:
 * {
 *   "total": 45.50,
 *   "detalles": [
 *     {
 *       "id_producto": 1,
 *       "cantidad": 10,
 *       "subtotal": 5.00,
 *       "es_servicio": false
 *     },
 *     {
 *       "id_producto": 2,
 *       "cantidad": 1,
 *       "subtotal": 120.00,
 *       "es_servicio": true
 *     }
 *   ]
 * }
 */
exports.crearVenta = (req, res) => {
    const { total, detalles } = req.body;

    // ========== VALIDACIÓN INICIAL ==========

    // Validar total
    const totalNum = parseFloat(total);
    if (isNaN(totalNum) || totalNum <= 0) {
        return res.status(400).json({
            error: 'El total debe ser un número mayor a 0.'
        });
    }

    // Validar detalles
    if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({
            error: 'Debes incluir al menos un producto en la venta.'
        });
    }

    // Validar estructura de cada detalle
    for (const detalle of detalles) {
        const { cantidad, subtotal, es_servicio } = detalle;

        // Validar cantidad
        const cantidadNum = parseInt(cantidad);
        if (isNaN(cantidadNum) || cantidadNum <= 0) {
            return res.status(400).json({
                error: 'La cantidad de cada item debe ser mayor a 0.'
            });
        }

        // Validar subtotal
        const subtotalNum = parseFloat(subtotal);
        if (isNaN(subtotalNum) || subtotalNum <= 0) {
            return res.status(400).json({
                error: 'El subtotal de cada item debe ser mayor a 0.'
            });
        }

        // Si es servicio, validar id_servicio
        if (es_servicio === true) {
            if (!detalle.id_servicio) {
                return res.status(400).json({
                    error: 'Los servicios deben incluir id_servicio.'
                });
            }
        } else {
            // Si es producto, validar id_producto
            if (isNaN(detalle.id_producto) || parseInt(detalle.id_producto) <= 0) {
                return res.status(400).json({
                    error: 'Cada producto debe tener un id_producto válido.'
                });
            }
        }
    }

    // ========== VERIFICAR STOCK (solo para artículos tangibles) ==========
    // Para servicios rápidos y trámites, saltamos validación de stock
    const promesas = detalles.map(detalle => {
        return new Promise((resolve, reject) => {
            db.get(
                'SELECT id_articulo, stock, nombre, tipo_item FROM articulos WHERE id_articulo = ?',
                [parseInt(detalle.id_articulo)],
                (err, row) => {
                    if (err) reject(err);
                    if (!row) reject(new Error(`Artículo ${detalle.id_articulo} no existe`));

                    // Si es tangible, validar stock
                    if (row.tipo_item === 'tangible') {
                        const cantidad = parseInt(detalle.cantidad);
                        if (row.stock < cantidad) {
                            reject(new Error(
                                `Stock insuficiente. ${row.nombre} disponibles: ${row.stock}, solicitados: ${cantidad}`
                            ));
                        }
                    }
                    // Para servicios rápidos y trámites, no validamos stock
                    resolve(row);
                }
            );
        });
    });

    Promise.all(promesas)
        .then(() => ejecutarTransaccionVenta(res, totalNum, detalles))
        .catch(error => {
            console.error('❌ Error validando artículos:', error.message);
            return res.status(400).json({
                error: error.message
            });
        });
};

/**
 * Ejecuta la transacción SQL de la venta
 * Utiliza BEGIN/COMMIT/ROLLBACK
 */
function ejecutarTransaccionVenta(res, total, detalles) {
    // Iniciamos transacción
    db.run('BEGIN TRANSACTION', function(err) {
        if (err) {
            console.error('❌ Error iniciando transacción:', err.message);
            return res.status(500).json({
                error: 'Error al procesar la venta.'
            });
        }

        // PASO 1: Insertar venta
        const sqlVenta = `
            INSERT INTO ventas (fecha, total)
            VALUES (CURRENT_TIMESTAMP, ?)
        `;

        db.run(sqlVenta, [total], function(insertErr) {
            if (insertErr) {
                console.error('❌ Error al insertar venta:', insertErr.message);
                return db.run('ROLLBACK', () => {
                    res.status(500).json({
                        error: 'Error al crear la venta.'
                    });
                });
            }

            const id_venta = this.lastID;

            // PASO 2: Insertar detalles
            let detallesInsertados = 0;
            let hayError = false;

            detalles.forEach((detalle, index) => {
                const sqlDetalle = `
                    INSERT INTO detalles_venta (id_venta, id_articulo, cantidad, subtotal, precio_venta)
                    VALUES (?, ?, ?, ?, ?)
                `;

                db.run(
                    sqlDetalle,
                    [
                        id_venta,
                        parseInt(detalle.id_articulo),
                        parseInt(detalle.cantidad),
                        parseFloat(detalle.subtotal),
                        parseFloat(detalle.precio_venta || detalle.subtotal / detalle.cantidad)
                    ],
                    (detalleErr) => {
                        if (detalleErr) {
                            if (!hayError) {
                                hayError = true;
                                console.error('❌ Error al insertar detalle:', detalleErr.message);
                                return db.run('ROLLBACK', () => {
                                    res.status(500).json({
                                        error: 'Error al guardar los detalles de la venta.'
                                    });
                                });
                            }
                            return;
                        }

                        detallesInsertados++;

                        // Una vez insertados todos los detalles, actualizar stock
                        if (detallesInsertados === detalles.length) {
                            actualizarStockProductos(res, id_venta, total, detalles);
                        }
                    }
                );
            });
        });
    });
}

/**
 * Actualiza el stock de artículos después de la venta
 * NOTA: Solo actualiza stock si el artículo es tipo 'tangible'
 * Para 'servicio_rapido' y 'tramite', no se descuenta stock
 */
function actualizarStockProductos(res, id_venta, total, detalles) {
    // Consultar tipo_item para cada artículo
    let procesados = 0;
    const articulosConTipo = [];

    detalles.forEach((detalle, idx) => {
        db.get(
            'SELECT tipo_item FROM articulos WHERE id_articulo = ?',
            [parseInt(detalle.id_articulo)],
            (err, row) => {
                if (err) {
                    console.error('❌ Error consultando tipo_item:', err.message);
                    return db.run('ROLLBACK', () => {
                        res.status(500).json({
                            error: 'Error al procesar la venta.'
                        });
                    });
                }

                articulosConTipo.push({
                    ...detalle,
                    tipo_item: row ? row.tipo_item : 'tangible'
                });

                procesados++;

                // Una vez consultados todos, proceder a actualizar stock
                if (procesados === detalles.length) {
                    realizarActualizacionesStock(res, id_venta, total, articulosConTipo, detalles.length);
                }
            }
        );
    });
}

/**
 * Realiza las actualizaciones de stock solo para artículos tangibles
 */
function realizarActualizacionesStock(res, id_venta, total, articulosConTipo, totalItems) {
    // Filtrar solo artículos tangibles
    const tangiblesParaActualizar = articulosConTipo.filter(a => a.tipo_item === 'tangible');

    // Si no hay tangibles, hacer COMMIT directamente
    if (tangiblesParaActualizar.length === 0) {
        db.run('COMMIT', (commitErr) => {
            if (commitErr) {
                console.error('❌ Error en COMMIT:', commitErr.message);
                return res.status(500).json({
                    error: 'Error al finalizar la transacción.'
                });
            }

            // ✅ TODO EXITOSO (solo servicios)
            res.status(201).json({
                message: 'Venta registrada exitosamente',
                venta: {
                    id_venta,
                    total,
                    cantidad_items: totalItems,
                    fecha: new Date().toISOString()
                }
            });
        });
        return;
    }

    let actualizacionesRealizadas = 0;

    tangiblesParaActualizar.forEach((detalle) => {
        const sqlUpdate = `
            UPDATE articulos 
            SET stock = stock - ? 
            WHERE id_articulo = ?
        `;

        db.run(
            sqlUpdate,
            [parseInt(detalle.cantidad), parseInt(detalle.id_articulo)],
            (updateErr) => {
                if (updateErr) {
                    console.error('❌ Error actualizando stock:', updateErr.message);
                    return db.run('ROLLBACK', () => {
                        res.status(500).json({
                            error: 'Error al actualizar el inventario.'
                        });
                    });
                }

                actualizacionesRealizadas++;

                // Una vez actualizado todo, hacer COMMIT
                if (actualizacionesRealizadas === tangiblesParaActualizar.length) {
                    db.run('COMMIT', (commitErr) => {
                        if (commitErr) {
                            console.error('❌ Error en COMMIT:', commitErr.message);
                            return res.status(500).json({
                                error: 'Error al finalizar la transacción.'
                            });
                        }

                        // ✅ TODO EXITOSO
                        res.status(201).json({
                            message: 'Venta registrada exitosamente',
                            venta: {
                                id_venta,
                                total,
                                cantidad_items: totalItems,
                                fecha: new Date().toISOString()
                            }
                        });
                    });
                }
            }
        );
    });
}

/**
 * GET /api/ventas/reportes/resumen
 * Obtiene un resumen de ventas del día
 */
exports.obtenerResumenVentasDia = (req, res) => {
    const sql = `
        SELECT 
            DATE(fecha) as fecha,
            COUNT(*) as total_ventas,
            SUM(total) as total_vendido,
            AVG(total) as venta_promedio,
            MAX(total) as venta_mayor,
            MIN(total) as venta_menor
        FROM ventas
        WHERE DATE(fecha) = DATE('now')
        GROUP BY DATE(fecha)
    `;

    db.get(sql, [], (err, row) => {
        if (err) {
            console.error('❌ Error al obtener resumen:', err.message);
            return res.status(500).json({
                error: 'Error al obtener el resumen.'
            });
        }

        res.json({ data: row || {} });
    });
};

/**
 * GET /api/ventas/reportes/productos-vendidos
 * Obtiene los productos más vendidos
 */
exports.obtenerProductosMasVendidos = (req, res) => {
    const sql = `
        SELECT 
            p.id_producto,
            p.nombre,
            p.codigo_barras,
            SUM(dv.cantidad) as total_vendido,
            SUM(dv.subtotal) as total_ingresos,
            COUNT(DISTINCT dv.id_venta) as veces_vendido
        FROM detalles_venta dv
        JOIN productos p ON dv.id_producto = p.id_producto
        GROUP BY p.id_producto
        ORDER BY total_vendido DESC
        LIMIT 10
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('❌ Error al obtener productos más vendidos:', err.message);
            return res.status(500).json({
                error: 'Error al obtener el reporte.'
            });
        }

        res.json({ data: rows || [] });
    });
};

