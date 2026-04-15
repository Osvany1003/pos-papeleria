document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('ventaForm');
    const tablaBody = document.querySelector('#tablaVentas tbody');
    const totalElement = document.getElementById('totalVenta');
    const inputProducto = document.getElementById('producto'); // Referencia para el focus

    // Cargar ventas al iniciar
    cargarVentas();

    // Evento Submit del Formulario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 1. Captura de datos del formulario HTML
        const producto = document.getElementById('producto').value;
        const cantidad = document.getElementById('cantidad').value;
        const precio = document.getElementById('precio').value;

        // 2. VALIDACIÓN FRONTEND (UX - Evita envíos innecesarios)
        if (!producto.trim()) {
            alert('Por favor, escribe el nombre del producto.');
            return;
        }
        if (cantidad < 1) {
            alert('La cantidad mínima es 1.');
            return;
        }
        if (precio < 0) {
            alert('El precio no puede ser negativo.');
            return;
        }

        const nuevaVenta = { producto, cantidad, precio };

        try {
            // 3. Envío al Backend
            const response = await fetch('http://localhost:3000/api/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevaVenta)
            });

            const result = await response.json();

            // 4. Manejo de Respuesta (Éxito o Error)
            if (!response.ok) {
                // Si el servidor devuelve 400 o 500, mostramos el mensaje de error del backend
                throw new Error(result.error || 'Error desconocido en el servidor');
            }

            // Éxito
            cargarVentas(); // Recargamos la tabla
            form.reset();   // Limpiamos el formulario
            inputProducto.focus(); // MEJORA UX: Cursor vuelve al inicio para siguiente venta rapida

        } catch (error) {
            console.error('Error:', error);
            alert('❌ Hubo un problema: ' + error.message);
        }
    });

    // Función para obtener y renderizar ventas
    async function cargarVentas() {
        try {
            const response = await fetch('http://localhost:3000/api/ventas');
            if (!response.ok) throw new Error('No se pudo conectar con el sistema');

            const data = await response.json();
            renderizarTabla(data.data);
        } catch (error) {
            console.error('Error cargando ventas:', error);
            totalElement.textContent = 'Error de conexión';
            totalElement.style.color = 'red';
        }
    }

    function renderizarTabla(ventas) {
        tablaBody.innerHTML = '';
        let totalGeneral = 0;

        ventas.forEach(venta => {
            const subtotal = venta.cantidad * venta.precio;
            totalGeneral += subtotal;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${venta.producto}</td>
                <td>${venta.cantidad}</td>
                <td>$${venta.precio.toFixed(2)}</td>
                <td>$${subtotal.toFixed(2)}</td>
                <td>${venta.fecha || ''}</td>
            `;
            tablaBody.appendChild(row);
        });

        totalElement.textContent = `$${totalGeneral.toFixed(2)}`;
        totalElement.style.color = '#000'; // Restaurar color por si hubo error antes
    }
});