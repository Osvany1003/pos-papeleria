let productos = [];
let total = 0;

const productoInput = document.getElementById("producto");
const precioInput = document.getElementById("precio");
const cantidadInput = document.getElementById("cantidad");
const lista = document.getElementById("lista");
const totalSpan = document.getElementById("total");

document.getElementById("agregar").addEventListener("click", () => {

    const producto = productoInput.value;
    const precio = parseFloat(precioInput.value);
    const cantidad = parseInt(cantidadInput.value);

    if (!producto || precio <= 0 || cantidad <= 0) {
        alert("Datos inválidos");
        return;
    }

    const subtotal = precio * cantidad;

    productos.push({
        producto,
        precio,
        cantidad,
        subtotal
    });

    total += subtotal;

    renderLista();

    productoInput.value = "";
    precioInput.value = "";
    cantidadInput.value = "";
});

function renderLista() {

    lista.innerHTML = "";

    productos.forEach(p => {
        const row = `
      <tr>
        <td>${p.producto}</td>
        <td>${p.precio}</td>
        <td>${p.cantidad}</td>
        <td>${p.subtotal}</td>
      </tr>
    `;
        lista.innerHTML += row;
    });

    totalSpan.textContent = total;
}
document.getElementById("confirmar").addEventListener("click", () => {

    if (productos.length === 0) {
        alert("No hay productos");
        return;
    }

    fetch("http://localhost:3000/api/ventas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            total: total,
            productos: productos
        })
    })
        .then(res => res.json())
        .then(data => {
            alert("Venta guardada");

            productos = [];
            total = 0;

            renderLista();
        })
        .catch(err => {
            console.error(err);
            alert("Error al guardar");
        });

});
