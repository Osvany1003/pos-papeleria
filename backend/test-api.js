/**
 * Script simple para probar API v2.0
 * node test-api.js
 */

const http = require('http');

function testAPI(path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: json
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        error: 'Parse error',
                        raw: data
                    });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ error: error.message });
        });

        req.end();
    });
}

async function runTests() {
    console.log('\n🧪 TESTING API v2.0\n');

    // Test 1: GET /api/productos
    console.log('📋 Test 1: GET /api/productos');
    let result = await testAPI('/api/productos');
    if (result.data && result.data.data) {
        console.log(`   ✅ Recibidos ${result.data.data.length} artículos`);
    } else {
        console.log(`   ❌ Error:`, result);
    }

    // Test 2: GET /api/productos/buscar?q=Copia
    console.log('\n📋 Test 2: GET /api/productos/buscar?q=Copia');
    result = await testAPI('/api/productos/buscar?q=Copia');
    if (result.data && result.data.data) {
        console.log(`   ✅ Encontrados ${result.data.data.length} artículos con "Copia"`);
        result.data.data.forEach(art => {
            console.log(`      - ${art.nombre} (${art.tipo_item})`);
        });
    } else {
        console.log(`   ❌ Error:`, result);
    }

    // Test 3: GET /api/productos/1
    console.log('\n📋 Test 3: GET /api/productos/1');
    result = await testAPI('/api/productos/1');
    if (result.data && result.data.data) {
        const art = result.data.data;
        console.log(`   ✅ ${art.nombre}`);
        console.log(`      - Tipo: ${art.tipo_item}`);
        console.log(`      - Precio: $${art.precio_venta}`);
    } else {
        console.log(`   ❌ Error:`, result);
    }

    console.log('\n✅ TESTS COMPLETADOS\n');
    process.exit(0);
}

// Esperar a que el servidor esté listo
setTimeout(runTests, 1000);

