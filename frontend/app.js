/**
 * APP.JS - LÓGICA PRINCIPAL DEL FRONTEND
 *
 * Sistema POS con:
 * - Carrito dinámico
 * - Búsqueda de productos
 * - Gestión de inventario (CRUD)
 * - Transacciones de venta
 * - Reportes en tiempo real
 */

// ========== CONSTANTES ==========
const API_BASE = 'http://localhost:3000/api';
const ENDPOINTS = {
    PRODUCTOS: `${API_BASE}/productos`,
    VENTAS: `${API_BASE}/ventas`,
};

// ========== ESTADO GLOBAL ==========
const app = {
    carrito: [],  // Array de items en el carrito
    productoEnEdicion: null,  // Para editar productos
};

// ========== INICIALIZACIÓN (DOMContentLoaded) ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Aplicación iniciada');

    // Cargar productos al inventario
    cargarProductosInventario();
    cargarResumenDia();
    cargarHistorialVentas();
    cargarProductosMasVendidos();

    // Configurar event listeners
    configurarEventListeners();
});

// ========== CONFIGURAR EVENT LISTENERS ==========
function configurarEventListeners() {
    // Tabs del sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            cambiarTab(tabId);
        });
    });

    // POS: Búsqueda de productos
    document.getElementById('busqueda-producto').addEventListener('input', (e) => {
        buscarProductosParaVenta(e.target.value);
    });

    // Inventario: Formulario de nuevo producto
    document.getElementById('formulario-producto').addEventListener('submit', (e) => {
        e.preventDefault();
        crearProducto();
    });

    // Inventario: Recargar
    document.getElementById('btn-recargar-inventario').addEventListener('click', cargarProductosInventario);

    // POS: Botones del carrito
    document.getElementById('btn-cobrar').addEventListener('click', cobrarVenta);
    document.getElementById('btn-limpiar-carrito').addEventListener('click', limpiarCarrito);

    // Modales: Cerrar
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });

    // Editar producto
    document.getElementById('btn-guardar-edicion').addEventListener('click', guardarEdicionProducto);
}

// ========== GESTIÓN DE TABS ==========
function cambiarTab(tabId) {
    // Ocultar todos los tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Desactivar todos los botones
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar el tab seleccionado
    document.getElementById(tabId).classList.add('active');

    // Activar el botón correspondiente
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Recargar datos si es necesario
    if (tabId === 'reportes-tab') {
        cargarResumenDia();
        cargarHistorialVentas();
        cargarProductosMasVendidos();
    }
}

// ========== MÓDULO: PUNTO DE VENTA ==========

/**
 * Busca productos por nombre o código
 */
async function buscarProductosParaVenta(termino) {
    const resultadosDiv = document.getElementById('resultados-busqueda');

    if (termino.trim() === '') {
        resultadosDiv.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`${ENDPOINTS.PRODUCTOS}/buscar?q=${encodeURIComponent(termino)}`);
        if (!response.ok) throw new Error('Error en búsqueda');

        const data = await response.json();
        mostrarResultadosBusqueda(data.data || [], resultadosDiv);
    } catch (error) {
        console.error('Error buscando productos:', error);
        resultadosDiv.innerHTML = '<p class="error">Error al buscar productos</p>';
    }
}

/**
 * Renderiza los resultados de búsqueda
 */
function mostrarResultadosBusqueda(productos, contenedor) {
    if (productos.length === 0) {
        contenedor.innerHTML = '<p class="info">No hay productos encontrados</p>';
        return;
    }

    contenedor.innerHTML = productos.map(p => `
        <div class="producto-item">
            <div class="producto-info">
                <strong>${p.nombre}</strong>
                <small>Código: ${p.codigo_barras || 'N/A'}</small>
                <small class="stock ${p.stock <= 5 ? 'low-stock' : 'ok-stock'}">
                    Stock: ${p.stock}
                </small>
            </div>
            <div class="producto-precio">
                <strong>$${p.precio.toFixed(2)}</strong>
                <button 
                    class="btn-icon-add" 
                    onclick="agregarAlCarrito(${p.id_producto}, '${p.nombre}', ${p.precio}, ${p.stock})"
                    title="Agregar al carrito"
                >
                    <span class="material-icons">add_shopping_cart</span>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Agrega un servicio al carrito
 * 
 * @param {string} id - Identificador del servicio (ej: "copia-bn", "acta-nacimiento")
 * @param {number} precioDefault - Precio por defecto del servicio
 * @param {boolean} esVariable - Si true, abre un prompt para que el usuario defina el precio
 */
function agregarServicioAlCarrito(id, precioDefault, esVariable) {
    let nombre = '';
    let precio = precioDefault;

    // Mapeo de IDs a nombres legibles
    const mapeoServicios = {
        'copia-bn': 'Copia B/N',
        'copia-color': 'Copia Color',
        'acta-nacimiento': 'Acta de Nacimiento',
        'curp': 'CURP',
        'ciber-tiempo': 'Ciber Tiempo (minuto)'
    };

    nombre = mapeoServicios[id] || id;

    // Si es variable, preguntar al usuario por el precio
    if (esVariable) {
        const precioIngresado = prompt(`Ingresa el precio para ${nombre}:`, precioDefault.toFixed(2));
        
        if (precioIngresado === null) {
            // Usuario canceló
            return;
        }

        const precioNum = parseFloat(precioIngresado);
        if (isNaN(precioNum) || precioNum <= 0) {
            alert('❌ El precio debe ser un número válido mayor a 0');
            return;
        }

        precio = precioNum;
    }

    // Cantidad siempre es 1 para servicios
    const cantidad = 1;

    // Buscar si ya existe este servicio en el carrito
    const itemExistente = app.carrito.find(item => item.id_servicio === id);

    if (itemExistente) {
        // Si existe, incrementar la cantidad
        itemExistente.cantidad += cantidad;
    } else {
        // Agregar nuevo servicio al carrito
        app.carrito.push({
            id_servicio: id,      // Identificador del servicio
            nombre,
            precio,
            cantidad,
            subtotal: precio * cantidad,
            es_servicio: true      // Bandera crítica para el backend
        });
    }

    renderizarCarrito();
    console.log(`✅ Servicio "${nombre}" agregado al carrito`);
}

/**
 * Agrega un producto al carrito
 */
function agregarAlCarrito(id_producto, nombre, precio, stockDisponible) {
    // Cantidad por defecto
    const cantidad = 1;

    // Validar stock
    if (stockDisponible < cantidad) {
        alert(`❌ Stock insuficiente. Disponibles: ${stockDisponible}`);
        return;
    }

    // Buscar si ya existe en el carrito
    const itemExistente = app.carrito.find(item => item.id_producto === id_producto);

    if (itemExistente) {
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        if (stockDisponible < nuevaCantidad) {
            alert(`❌ No hay suficiente stock. Máximo: ${stockDisponible}`);
            return;
        }
        itemExistente.cantidad = nuevaCantidad;
    } else {
        app.carrito.push({
            id_producto,
            nombre,
            precio,
            cantidad,
            subtotal: precio * cantidad
        });
    }

    renderizarCarrito();
    limpiarBusqueda();
}

/**
 * Renderiza el carrito (soporta productos y servicios)
 */
function renderizarCarrito() {
    const carritoItems = document.getElementById('carrito-items');
    let subtotal = 0;

    if (app.carrito.length === 0) {
        carritoItems.innerHTML = '<tr class="empty-row"><td colspan="5">Carrito vacío</td></tr>';
        actualizarTotales(0);
        return;
    }

    carritoItems.innerHTML = app.carrito.map((item, index) => {
        subtotal += item.subtotal;
        // Mostrar badge si es servicio
        const badgeServicio = item.es_servicio ? '<span class="badge badge-info">Servicio</span>' : '';
        
        return `
            <tr ${item.es_servicio ? 'class="row-servicio"' : ''}>
                <td>${item.nombre} ${badgeServicio}</td>
                <td>
                    <input 
                        type="number" 
                        value="${item.cantidad}" 
                        min="1" 
                        onchange="actualizarCantidadCarrito(${index}, this.value)"
                        class="cantidad-input"
                    >
                </td>
                <td>$${item.precio.toFixed(2)}</td>
                <td>$${item.subtotal.toFixed(2)}</td>
                <td>
                    <button 
                        class="btn-icon delete" 
                        onclick="eliminarDelCarrito(${index})"
                        title="Eliminar"
                    >
                        <span class="material-icons">delete</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    actualizarTotales(subtotal);
}

/**
 * Actualiza la cantidad de un item en el carrito
 */
function actualizarCantidadCarrito(index, nuevaCantidad) {
    const cantidad = parseInt(nuevaCantidad);

    if (isNaN(cantidad) || cantidad <= 0) {
        eliminarDelCarrito(index);
        return;
    }

    app.carrito[index].cantidad = cantidad;
    app.carrito[index].subtotal = app.carrito[index].precio * cantidad;
    renderizarCarrito();
}

/**
 * Elimina un item del carrito
 */
function eliminarDelCarrito(index) {
    app.carrito.splice(index, 1);
    renderizarCarrito();
}

/**
 * Actualiza los totales del carrito
 */
function actualizarTotales(subtotal) {
    const iva = 0; // Configurar según país
    const total = subtotal + iva;

    document.getElementById('subtotal-carrito').textContent = subtotal.toFixed(2);
    document.getElementById('iva-carrito').textContent = iva.toFixed(2);
    document.getElementById('total-carrito').textContent = total.toFixed(2);
}

/**
 * Limpia la búsqueda
 */
function limpiarBusqueda() {
    document.getElementById('busqueda-producto').value = '';
    document.getElementById('resultados-busqueda').innerHTML = '';
}

/**
 * Limpia el carrito
 */
function limpiarCarrito() {
    if (app.carrito.length === 0) {
        alert('El carrito ya está vacío');
        return;
    }

    if (confirm('¿Deseas limpiar el carrito?')) {
        app.carrito = [];
        renderizarCarrito();
    }
}

/**
 * FUNCIÓN CRÍTICA: Cobra la venta
 * Envía transacción al backend con validación de stock
 * Soporta tanto productos como servicios
 */
async function cobrarVenta() {
    // Validar carrito
    if (app.carrito.length === 0) {
        alert('❌ El carrito está vacío. Agrega productos antes de cobrar.');
        return;
    }

    // Calcular total
    const total = app.carrito.reduce((sum, item) => sum + item.subtotal, 0);

    // Preparar payload - incluir bandera es_servicio en cada detalle
    const detalles = app.carrito.map(item => ({
        id_producto: item.id_producto || null,  // null para servicios
        id_servicio: item.id_servicio || null,  // ID del servicio si aplica
        cantidad: item.cantidad,
        subtotal: item.subtotal,
        es_servicio: item.es_servicio || false  // Bandera crítica
    }));

    const payload = {
        total,
        detalles
    };

    console.log('📤 Enviando venta al backend:', payload);

    // Mostrar loading
    const btnCobrar = document.getElementById('btn-cobrar');
    const textoOriginal = btnCobrar.innerHTML;
    btnCobrar.disabled = true;
    btnCobrar.innerHTML = '<span class="material-icons spin">sync</span> Procesando...';

    try {
        const response = await fetch(ENDPOINTS.VENTAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.error || 'Error al procesar la venta');
        }

        // ✅ ÉXITO
        alert(`✅ Venta registrada correctamente\n\nID: ${resultado.venta.id_venta}\nTotal: $${resultado.venta.total.toFixed(2)}`);

        // Limpiar carrito
        app.carrito = [];
        renderizarCarrito();

        // Recargar inventario y reportes
        cargarProductosInventario();
        cargarResumenDia();
        cargarHistorialVentas();
        cargarProductosMasVendidos();

    } catch (error) {
        console.error('❌ Error:', error);
        alert(`❌ Error al procesar la venta:\n${error.message}`);
    } finally {
        btnCobrar.disabled = false;
        btnCobrar.innerHTML = textoOriginal;
    }
}

// ========== MÓDULO: INVENTARIO ==========

/**
 * Carga los productos en la tabla de inventario
 */
async function cargarProductosInventario() {
    try {
        const response = await fetch(ENDPOINTS.PRODUCTOS);
        if (!response.ok) throw new Error('Error al cargar productos');

        const data = await response.json();
        renderizarTablaProductos(data.data || []);
    } catch (error) {
        console.error('Error cargando productos:', error);
        document.getElementById('tabla-productos').innerHTML =
            `<tr class="empty-row"><td colspan="6">Error al cargar productos</td></tr>`;
    }
}

/**
 * Renderiza la tabla de productos
 */
function renderizarTablaProductos(productos) {
    const tabla = document.getElementById('tabla-productos');

    if (productos.length === 0) {
        tabla.innerHTML = '<tr class="empty-row"><td colspan="6">No hay productos</td></tr>';
        return;
    }

    tabla.innerHTML = productos.map(p => `
        <tr>
            <td>#${p.id_producto}</td>
            <td>${p.codigo_barras || '-'}</td>
            <td><strong>${p.nombre}</strong></td>
            <td>$${p.precio.toFixed(2)}</td>
            <td>
                <span class="badge ${p.stock <= 5 ? 'badge-danger' : 'badge-success'}">
                    ${p.stock} unidades
                </span>
            </td>
            <td class="acciones-cell">
                <button class="btn-icon edit" onclick="abrirEdicionProducto(${p.id_producto})" title="Editar">
                    <span class="material-icons">edit</span>
                </button>
                <button class="btn-icon delete" onclick="eliminarProducto(${p.id_producto})" title="Eliminar">
                    <span class="material-icons">delete</span>
                </button>
            </td>
        </tr>
    `).join('');
}

/**
 * Crea un nuevo producto
 */
async function crearProducto() {
    const codigoBarras = document.getElementById('codigo-barras').value.trim() || null;
    const nombre = document.getElementById('nombre-producto').value.trim();
    const precio = parseFloat(document.getElementById('precio-producto').value);
    const stock = parseInt(document.getElementById('stock-producto').value);

    // Validación básica
    if (!nombre) {
        alert('El nombre del producto es obligatorio');
        return;
    }

    const payload = {
        codigo_barras: codigoBarras,
        nombre,
        precio,
        stock
    };

    try {
        const response = await fetch(ENDPOINTS.PRODUCTOS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.error || 'Error al crear producto');
        }

        alert(`✅ Producto "${nombre}" creado exitosamente`);
        document.getElementById('formulario-producto').reset();
        cargarProductosInventario();

    } catch (error) {
        console.error('Error:', error);
        alert(`❌ ${error.message}`);
    }
}

/**
 * Abre el modal para editar un producto
 */
async function abrirEdicionProducto(id) {
    try {
        const response = await fetch(`${ENDPOINTS.PRODUCTOS}/${id}`);
        if (!response.ok) throw new Error('Producto no encontrado');

        const data = await response.json();
        const producto = data.data;

        // Rellenar formulario
        document.getElementById('edit-producto-id').value = producto.id_producto;
        document.getElementById('edit-codigo-barras').value = producto.codigo_barras || '';
        document.getElementById('edit-nombre-producto').value = producto.nombre;
        document.getElementById('edit-precio-producto').value = producto.precio;
        document.getElementById('edit-stock-producto').value = producto.stock;

        // Mostrar modal
        document.getElementById('modal-editar-producto').style.display = 'flex';

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el producto');
    }
}

/**
 * Guarda la edición de un producto
 */
async function guardarEdicionProducto() {
    const id = document.getElementById('edit-producto-id').value;
    const payload = {
        codigo_barras: document.getElementById('edit-codigo-barras').value.trim() || null,
        nombre: document.getElementById('edit-nombre-producto').value.trim(),
        precio: parseFloat(document.getElementById('edit-precio-producto').value),
        stock: parseInt(document.getElementById('edit-stock-producto').value)
    };

    try {
        const response = await fetch(`${ENDPOINTS.PRODUCTOS}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.error || 'Error al actualizar');
        }

        alert('✅ Producto actualizado');
        document.getElementById('modal-editar-producto').style.display = 'none';
        cargarProductosInventario();

    } catch (error) {
        console.error('Error:', error);
        alert(`❌ ${error.message}`);
    }
}

/**
 * Elimina un producto
 */
async function eliminarProducto(id) {
    if (!confirm('¿Seguro de eliminar este producto?')) return;

    try {
        const response = await fetch(`${ENDPOINTS.PRODUCTOS}/${id}`, {
            method: 'DELETE'
        });

        const resultado = await response.json();

        if (!response.ok) {
            throw new Error(resultado.error || 'Error al eliminar');
        }

        alert('✅ Producto eliminado');
        cargarProductosInventario();

    } catch (error) {
        console.error('Error:', error);
        alert(`❌ ${error.message}`);
    }
}

// ========== MÓDULO: REPORTES ==========

/**
 * Carga el resumen del día
 */
async function cargarResumenDia() {
    try {
        const response = await fetch(`${ENDPOINTS.VENTAS}/reportes/resumen`);
        if (!response.ok) throw new Error('Error');

        const data = await response.json();
        const resumen = data.data || {};

        document.getElementById('stat-ventas-hoy').textContent = resumen.total_ventas || 0;
        document.getElementById('stat-ingresos-hoy').textContent =
            `$${(resumen.total_vendido || 0).toFixed(2)}`;
        document.getElementById('stat-promedio-hoy').textContent =
            `$${(resumen.venta_promedio || 0).toFixed(2)}`;
        document.getElementById('stat-mayor-hoy').textContent =
            `$${(resumen.venta_mayor || 0).toFixed(2)}`;

    } catch (error) {
        console.error('Error cargando resumen:', error);
    }
}

/**
 * Carga el historial de ventas
 */
async function cargarHistorialVentas() {
    try {
        const response = await fetch(ENDPOINTS.VENTAS);
        if (!response.ok) throw new Error('Error');

        const data = await response.json();
        renderizarTablaVentas(data.data || []);

    } catch (error) {
        console.error('Error cargando ventas:', error);
        document.getElementById('tabla-ventas').innerHTML =
            `<tr class="empty-row"><td colspan="5">Error al cargar</td></tr>`;
    }
}

/**
 * Renderiza el historial de ventas
 */
function renderizarTablaVentas(ventas) {
    const tabla = document.getElementById('tabla-ventas');

    if (ventas.length === 0) {
        tabla.innerHTML = '<tr class="empty-row"><td colspan="5">No hay ventas registradas</td></tr>';
        return;
    }

    tabla.innerHTML = ventas.slice(0, 10).map(v => {
        const fecha = new Date(v.fecha).toLocaleString('es-ES');
        return `
            <tr>
                <td>#${v.id_venta}</td>
                <td>${fecha}</td>
                <td>${v.cantidad_productos} producto(s)</td>
                <td><strong>$${v.total.toFixed(2)}</strong></td>
                <td>
                    <button class="btn-icon" onclick="verDetalleVenta(${v.id_venta})" title="Ver detalle">
                        <span class="material-icons">visibility</span>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Carga los productos más vendidos
 */
async function cargarProductosMasVendidos() {
    try {
        const response = await fetch(`${ENDPOINTS.VENTAS}/reportes/productos`);
        if (!response.ok) throw new Error('Error');

        const data = await response.json();
        renderizarTablaTopProductos(data.data || []);

    } catch (error) {
        console.error('Error cargando top productos:', error);
        document.getElementById('tabla-top-productos').innerHTML =
            `<tr class="empty-row"><td colspan="4">Error al cargar</td></tr>`;
    }
}

/**
 * Renderiza tabla de productos más vendidos
 */
function renderizarTablaTopProductos(productos) {
    const tabla = document.getElementById('tabla-top-productos');

    if (productos.length === 0) {
        tabla.innerHTML = '<tr class="empty-row"><td colspan="4">Sin datos aún</td></tr>';
        return;
    }

    tabla.innerHTML = productos.map(p => `
        <tr>
            <td><strong>${p.nombre}</strong><br><small>${p.codigo_barras || 'N/A'}</small></td>
            <td>${p.total_vendido} unidades</td>
            <td>$${p.total_ingresos.toFixed(2)}</td>
            <td>${p.veces_vendido} venta(s)</td>
        </tr>
    `).join('');
}

/**
 * Ver detalle de una venta
 */
async function verDetalleVenta(idVenta) {
    try {
        const response = await fetch(`${ENDPOINTS.VENTAS}/${idVenta}`);
        if (!response.ok) throw new Error('Venta no encontrada');

        const data = await response.json();
        const venta = data.data;
        const fecha = new Date(venta.fecha).toLocaleString('es-ES');

        let detalleHTML = `
            <div class="detalle-header">
                <p><strong>ID Venta:</strong> ${venta.id_venta}</p>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Total:</strong> <span class="total-amount">$${venta.total.toFixed(2)}</span></p>
            </div>
            <table class="detalle-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
        `;

        venta.detalles.forEach(d => {
            detalleHTML += `
                <tr>
                    <td>${d.nombre_producto}</td>
                    <td>${d.cantidad}</td>
                    <td>$${d.subtotal.toFixed(2)}</td>
                </tr>
            `;
        });

        detalleHTML += `
                </tbody>
            </table>
        `;

        document.getElementById('contenido-detalle-venta').innerHTML = detalleHTML;
        document.getElementById('modal-detalle-venta').style.display = 'flex';

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar detalle de venta');
    }
}

