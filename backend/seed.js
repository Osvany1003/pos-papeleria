/**
 * SEED: Datos iniciales para tests
 * Crea productos de prueba incluyendo tijeras
 *
 * Ejecutar: node backend/seed.js
 */

const db = require('./database');

// Productos de prueba
const productos = [
    {
        codigo_barras: 'TIJ001',
        nombre: 'Tijeras Escolares 5"',
        precio: 2.50,
        stock: 50,
        es_servicio: 0
    },
    {
        codigo_barras: 'TIJ002',
        nombre: 'Tijeras de Precisión 7"',
        precio: 5.99,
        stock: 30,
        es_servicio: 0
    },
    {
        codigo_barras: 'BOL001',
        nombre: 'Bolígrafo Negro',
        precio: 0.75,
        stock: 200,
        es_servicio: 0
    },
    {
        codigo_barras: 'BOL002',
        nombre: 'Bolígrafo Azul',
        precio: 0.75,
        stock: 180,
        es_servicio: 0
    },
    {
        codigo_barras: 'LAP001',
        nombre: 'Lápiz HB',
        precio: 0.50,
        stock: 300,
        es_servicio: 0
    },
    {
        codigo_barras: 'CUA001',
        nombre: 'Cuaderno A4 100 hojas',
        precio: 3.99,
        stock: 75,
        es_servicio: 0
    },
    {
        codigo_barras: 'MOC001',
        nombre: 'Mochila Escolar',
        precio: 15.99,
        stock: 20,
        es_servicio: 0
    },
    {
        codigo_barras: 'PEG001',
        nombre: 'Pegamento Escolar 40g',
        precio: 1.25,
        stock: 120,
        es_servicio: 0
    }
];

console.log('🌱 Iniciando seed de productos...\n');

// Esperar a que las tablas se creen (500ms debería ser suficiente)
setTimeout(() => {
    // Limpiar tabla anterior (opcional - comentar si quieres mantener datos)
    // db.run('DELETE FROM productos', (err) => {
    //     if (err) console.error('Error limpiando tabla:', err);
    // });

    let productosInsertados = 0;

    productos.forEach((producto, index) => {
    const sql = `
        INSERT OR REPLACE INTO productos (codigo_barras, nombre, precio, stock, es_servicio)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            producto.codigo_barras,
            producto.nombre,
            producto.precio,
            producto.stock,
            producto.es_servicio
        ],
        function(err) {
            if (err) {
                console.error(`❌ Error insertando ${producto.nombre}:`, err.message);
            } else {
                productosInsertados++;
                console.log(`✅ ${producto.nombre} - Stock: ${producto.stock} - Precio: $${producto.precio.toFixed(2)}`);
            }

            // Si es el último producto, mostrar resumen
            if (index === productos.length - 1) {
                setTimeout(() => {
                    console.log(`\n📊 Seed completado: ${productosInsertados}/${productos.length} productos insertados`);
                    process.exit(0);
                }, 500);
            }
        }
    );
    });
}, 1000);

