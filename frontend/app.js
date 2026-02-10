let carrito = [];

// --- NAVEGACIÓN ---
function mostrarSeccion(id) {
    // Ocultar todas las secciones
    document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
    // Quitar active de botones
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    // Mostrar la seleccionada
    document.getElementById(id).style.display = 'block';

    // Marcar botón activo (esto es un truco simple visual)
    const btnMap = { 'venta-panel': 0, 'reportes-panel': 1 };
    document.querySelectorAll('.nav-btn')[btnMap[id] || 0].classList.add('active');
}

function cargarReportes() {
    mostrarSeccion('reportes-panel');
    fetch('/api/ventas') // Usa la ruta GET que creamos
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('lista-reportes');
            tbody.innerHTML = '';
            data.forEach(venta => {
                const fila = `
                    <tr>
                        <td>#${venta.id}</td>
                        <td>${new Date(venta.fecha).toLocaleString()}</td>
                        <td>${venta.items_count} items</td>
                        <td>$${venta.total.toFixed(2)}</td>
                    </tr>
                `;
                tbody.innerHTML += fila;
            });
        });
}

// --- LÓGICA DE VENTA ---
document.getElementById('btn-agregar').addEventListener('click', () => {
    const productoIn = document.getElementById('producto');
    const cantidadIn = document.getElementById('cantidad');
    const precioIn = document.getElementById('precio');

    const nombre = productoIn.value.toUpperCase(); // Asegurar mayúscula
    const cantidad = parseFloat(cantidadIn.value);
    const precio = parseFloat(precioIn.value);

    if (nombre && cantidad > 0 && precio >= 0) {
        const subtotal = cantidad * precio;

        carrito.push({ producto: nombre, cantidad, precio, subtotal });
        actualizarTabla();

        // Limpiar inputs
        productoIn.value = '';
        cantidadIn.value = 1;
        precioIn.value = '';
        productoIn.focus();
    } else {
        alert("Por favor rellena los datos correctamente (números positivos)");
    }
});

function actualizarTabla() {
    const tbody = document.getElementById('lista-venta');
    tbody.innerHTML = '';
    let total = 0;

    carrito.forEach((item, index) => {
        total += item.subtotal;
        tbody.innerHTML += `
            <tr>
                <td>${item.producto}</td>
                <td>${item.cantidad}</td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
                <td><button class="btn-delete" onclick="eliminarItem(${index})">X</button></td>
            </tr>
        `;
    });

    document.getElementById('total-venta').innerText = total.toFixed(2);
}

function eliminarItem(index) {
    carrito.splice(index, 1);
    actualizarTabla();
}

document.getElementById('btn-cobrar').addEventListener('click', () => {
    if (carrito.length === 0) return alert("El carrito está vacío");

    const venta = {
        fecha: new Date().toISOString(),
        items: carrito,
        total: parseFloat(document.getElementById('total-venta').innerText)
    };

    fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(venta)
    })
        .then(res => res.json())
        .then(data => {
            alert("Venta guardada exitosamente. ID: " + data.id);
            carrito = [];
            actualizarTabla();
        })
        .catch(err => alert("Error: " + err));
});