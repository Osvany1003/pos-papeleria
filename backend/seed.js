/**
 * SEED: Datos iniciales para BD v2.0
 * Crea artículos de prueba (productos y servicios)
 *
 * Ejecutar: node backend/seed.js
 */

const db = require('./database');

// Artículos v2.0 (Productos y Servicios)
const articulos = [
    // ===== PRODUCTOS (tipo_item: tangible) =====
    {
        codigo_barras: 'TIJ001',
        nombre: 'Tijeras Escolares 5"',
        precio_venta: 2.50,
        stock: 50,
        tipo_item: 'tangible',
        permite_precio_variable: 0
    },
    {
        codigo_barras: 'TIJ002',
        nombre: 'Tijeras de Precisión 7"',
        precio_venta: 5.99,
        stock: 30,
        tipo_item: 'tangible',
        permite_precio_variable: 0
    },
    {
        codigo_barras: 'BOL001',
        nombre: 'Bolígrafo Negro',
        precio_venta: 0.75,
        stock: 200,
        tipo_item: 'tangible',
        permite_precio_variable: 0
    },
    {
        codigo_barras: 'BOL002',
        nombre: 'Bolígrafo Azul',
        precio_venta: 0.75,
        stock: 180,
        tipo_item: 'tangible',
        permite_precio_variable: 0
    },
    {
        codigo_barras: 'LAP001',
        nombre: 'Lápiz HB',
        precio_venta: 0.50,
        stock: 300,
        tipo_item: 'tangible',
        permite_precio_variable: 0
    },
    {
        codigo_barras: 'CUA001',
        nombre: 'Cuaderno A4 100 hojas',
        precio_venta: 3.99,
        stock: 75,
        tipo_item: 'tangible',
        permite_precio_variable: 0
    },
    {
        codigo_barras: 'MOC001',
        nombre: 'Mochila Escolar',
        precio_venta: 15.99,
        stock: 20,
        tipo_item: 'tangible',
        permite_precio_variable: 0
    },
    {
        codigo_barras: 'PEG001',
        nombre: 'Pegamento Escolar 40g',
        precio_venta: 1.25,
        stock: 120,
        tipo_item: 'tangible',
        permite_precio_variable: 0
    },

    // ===== SERVICIOS (tipo_item: servicio_rapido) =====
    {
        codigo_barras: null,
        nombre: 'Copia B/N',
        precio_venta: 0.50,
        stock: 0,
        tipo_item: 'servicio_rapido',
        permite_precio_variable: 1
    },
    {
        codigo_barras: null,
        nombre: 'Copia Color',
        precio_venta: 2.00,
        stock: 0,
        tipo_item: 'servicio_rapido',
        permite_precio_variable: 1
    },
    {
        codigo_barras: null,
        nombre: 'Ciber Tiempo',
        precio_venta: 0.25,
        stock: 0,
        tipo_item: 'servicio_rapido',
        permite_precio_variable: 1
    },

    // ===== TRÁMITES (tipo_item: tramite) =====
    {
        codigo_barras: null,
        nombre: 'Acta Nacimiento',
        precio_venta: 120.00,
        stock: 0,
        tipo_item: 'tramite',
        permite_precio_variable: 0
    },
    {
        codigo_barras: null,
        nombre: 'CURP',
        precio_venta: 150.00,
        stock: 0,
        tipo_item: 'tramite',
        permite_precio_variable: 0
    }
];

console.log('🌱 Inicializando BD v2.0 con artículos...\n');

// Esperar a que las tablas se creen (1 segundo)
setTimeout(() => {
    let articulosInsertados = 0;

    articulos.forEach((articulo, index) => {
        const sql = `
            INSERT OR REPLACE INTO articulos (codigo_barras, nombre, precio_venta, stock, tipo_item, permite_precio_variable)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(
            sql,
            [
                articulo.codigo_barras,
                articulo.nombre,
                articulo.precio_venta,
                articulo.stock,
                articulo.tipo_item,
                articulo.permite_precio_variable
            ],
            function(err) {
                if (err) {
                    console.error(`❌ Error insertando ${articulo.nombre}:`, err.message);
                } else {
                    articulosInsertados++;
                    const tipo = articulo.tipo_item === 'tangible' ? '📦' :
                                 articulo.tipo_item === 'servicio_rapido' ? '⚡' : '📋';
                    console.log(`✅ ${tipo} ${articulo.nombre} - Precio: $${articulo.precio_venta.toFixed(2)}`);
                }

                // Si es el último artículo, mostrar resumen
                if (index === articulos.length - 1) {
                    setTimeout(() => {
                        console.log(`\n📊 Seed completado: ${articulosInsertados}/${articulos.length} artículos insertados`);
                        console.log('\n✅ BD v2.0 lista para usar\n');
                        process.exit(0);
                    }, 500);
                }
            }
        );
    });
}, 1000);

