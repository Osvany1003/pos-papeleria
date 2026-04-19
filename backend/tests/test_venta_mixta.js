/**
 * TEST: Venta Mixta (Productos + Servicios)
 *
 * Este test valida que el sistema POS puede procesar ventas que incluyen:
 * 1. Productos tradicionales (con stock que se descuenta)
 * 2. Servicios (sin stock, precio variable)
 *
 * Ejecutar: node backend/tests/test_venta_mixta.js
 */

const API_BASE = 'http://localhost:3000/api';

/**
 * Test: Crear una venta mixta con 1 producto y 1 servicio
 */
async function testVentaMixta() {
    console.log('\n📋 ===== INICIANDO TEST: VENTA MIXTA =====\n');

    try {
        // Payload de prueba
        const ventaMixta = {
            total: 125.50,
            detalles: [
                {
                    // ITEM 1: Producto físico (con descuento de stock)
                    id_producto: 1,
                    cantidad: 5,
                    subtotal: 5.50,
                    es_servicio: false
                },
                {
                    // ITEM 2: Servicio (sin descuento de stock)
                    id_producto: null,      // null para servicios
                    id_servicio: 'acta-nacimiento',
                    cantidad: 1,
                    subtotal: 120.00,
                    es_servicio: true
                }
            ]
        };

        console.log('📤 Enviando venta mixta al endpoint /api/ventas');
        console.log('Payload:', JSON.stringify(ventaMixta, null, 2));

        // Realizar petición POST al endpoint de ventas
        const response = await fetch(`${API_BASE}/ventas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ventaMixta)
        });

        const resultado = await response.json();

        if (response.ok) {
            console.log('\n✅ ÉXITO: Venta registrada correctamente');
            console.log('Respuesta del servidor:', JSON.stringify(resultado, null, 2));
            console.log('\n📊 Resumen:');
            console.log(`  - ID Venta: ${resultado.venta.id_venta}`);
            console.log(`  - Total: $${resultado.venta.total.toFixed(2)}`);
            console.log(`  - Items: ${resultado.venta.cantidad_productos}`);
            console.log(`  - Fecha: ${resultado.venta.fecha}`);
            console.log('\n✨ El test PASÓ: Venta mixta procesada correctamente\n');
        } else {
            console.log('\n❌ ERROR: La venta fue rechazada');
            console.log('Código HTTP:', response.status);
            console.log('Respuesta del servidor:', JSON.stringify(resultado, null, 2));
            console.log('\n✨ El test FALLÓ\n');
        }

    } catch (error) {
        console.error('\n❌ ERROR DE CONEXIÓN:');
        console.error('Mensaje:', error.message);
        console.error('\n⚠️ Asegúrate de que el servidor esté corriendo en http://localhost:3000');
        console.error('Ejecuta: npm start (en la carpeta backend)\n');
    }
}

/**
 * Test: Validar que un servicio con precio variable funciona
 */
async function testServicioVariableConPrecio() {
    console.log('\n📋 ===== INICIANDO TEST: SERVICIO CON PRECIO VARIABLE =====\n');

    try {
        const ventaServicio = {
            total: 7.50,
            detalles: [
                {
                    // Servicio: Copia B/N a precio custom ($7.50 por 15 copias)
                    id_producto: null,
                    id_servicio: 'copia-bn',
                    cantidad: 15,
                    subtotal: 7.50,
                    es_servicio: true
                }
            ]
        };

        console.log('📤 Enviando venta con servicio de precio variable');
        console.log('Payload:', JSON.stringify(ventaServicio, null, 2));

        const response = await fetch(`${API_BASE}/ventas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ventaServicio)
        });

        const resultado = await response.json();

        if (response.ok) {
            console.log('\n✅ ÉXITO: Venta con servicio variable registrada');
            console.log('Respuesta del servidor:', JSON.stringify(resultado, null, 2));
            console.log('\n✨ El test PASÓ: Servicio con precio variable funciona\n');
        } else {
            console.log('\n❌ ERROR: La venta fue rechazada');
            console.log('Código HTTP:', response.status);
            console.log('Respuesta del servidor:', JSON.stringify(resultado, null, 2));
            console.log('\n✨ El test FALLÓ\n');
        }

    } catch (error) {
        console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
        console.error('⚠️ Asegúrate de que el servidor esté corriendo\n');
    }
}

/**
 * Test: Validar que solo servicios (sin productos) funciona
 */
async function testVentaSoloServicios() {
    console.log('\n📋 ===== INICIANDO TEST: VENTA SOLO CON SERVICIOS =====\n');

    try {
        const ventaSoloServicios = {
            total: 425.00,
            detalles: [
                {
                    id_producto: null,
                    id_servicio: 'curp',
                    cantidad: 1,
                    subtotal: 150.00,
                    es_servicio: true
                },
                {
                    id_producto: null,
                    id_servicio: 'acta-nacimiento',
                    cantidad: 2,
                    subtotal: 240.00,
                    es_servicio: true
                },
                {
                    id_producto: null,
                    id_servicio: 'copia-color',
                    cantidad: 7,
                    subtotal: 14.00,
                    es_servicio: true
                }
            ]
        };

        console.log('📤 Enviando venta SOLO con servicios (sin productos)');
        console.log('Payload:', JSON.stringify(ventaSoloServicios, null, 2));

        const response = await fetch(`${API_BASE}/ventas`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ventaSoloServicios)
        });

        const resultado = await response.json();

        if (response.ok) {
            console.log('\n✅ ÉXITO: Venta con solo servicios registrada');
            console.log('Respuesta del servidor:', JSON.stringify(resultado, null, 2));
            console.log('\n✨ El test PASÓ: Venta solo con servicios funciona\n');
        } else {
            console.log('\n❌ ERROR: La venta fue rechazada');
            console.log('Código HTTP:', response.status);
            console.log('Respuesta del servidor:', JSON.stringify(resultado, null, 2));
            console.log('\n✨ El test FALLÓ\n');
        }

    } catch (error) {
        console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
        console.error('⚠️ Asegúrate de que el servidor esté corriendo\n');
    }
}

// ========== EJECUTAR TESTS ==========

(async () => {
    console.log('🧪 SUITE DE TESTS: INTEGRACIÓN SERVICIOS EN POS PAPELERÍA');
    console.log('=========================================================\n');

    // Ejecutar todos los tests
    await testVentaMixta();
    await testServicioVariableConPrecio();
    await testVentaSoloServicios();

    console.log('🎯 TODOS LOS TESTS COMPLETADOS\n');
})();