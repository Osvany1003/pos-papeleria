/**
 * Script para verificar la conexión a la BD v2.0
 */

const db = require('./database');

// Esperar a que se inicialice la BD
setTimeout(() => {
    console.log('\n=== VERIFICANDO BD v2.0 ===\n');

    // Test 1: Contar artículos
    db.get('SELECT COUNT(*) as total FROM articulos', [], (err, row) => {
        if (err) {
            console.error('❌ Error contando artículos:', err.message);
        } else {
            console.log(`✅ Total de artículos en BD: ${row.total}`);
        }
    });

    // Test 2: Listar todos los artículos
    db.all('SELECT id_articulo, nombre, tipo_item, precio_venta FROM articulos LIMIT 5', [], (err, rows) => {
        if (err) {
            console.error('❌ Error listando artículos:', err.message);
        } else {
            console.log(`\n✅ Primeros 5 artículos:`);
            rows.forEach(art => {
                console.log(`   - [${art.id_articulo}] ${art.nombre} (${art.tipo_item}) - $${art.precio_venta}`);
            });
        }
    });

    // Test 3: Contar por tipo
    db.all('SELECT tipo_item, COUNT(*) as cantidad FROM articulos GROUP BY tipo_item', [], (err, rows) => {
        if (err) {
            console.error('❌ Error contando por tipo:', err.message);
        } else {
            console.log(`\n✅ Artículos por tipo:`);
            rows.forEach(row => {
                console.log(`   - ${row.tipo_item}: ${row.cantidad}`);
            });
        }
    });

    // Test 4: Buscar un artículo específico
    const termino = 'Copia';
    db.all(`SELECT * FROM articulos WHERE nombre LIKE ?`, [`%${termino}%`], (err, rows) => {
        if (err) {
            console.error(`❌ Error buscando "${termino}":`, err.message);
        } else {
            console.log(`\n✅ Búsqueda "${termino}": ${rows.length} resultados`);
            rows.forEach(art => {
                console.log(`   - ${art.nombre}`);
            });
        }
    });

    setTimeout(() => {
        console.log('\n=== VERIFICACIÓN COMPLETADA ===\n');
        process.exit(0);
    }, 2000);

}, 1000);

