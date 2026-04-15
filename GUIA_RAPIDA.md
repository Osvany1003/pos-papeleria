# 🚀 GUÍA RÁPIDA - Sistema POS v2.0

## ⚡ Inicio Rápido (3 pasos)

### 1️⃣ Instalar dependencias
```bash
cd backend
npm install
```

### 2️⃣ Iniciar servidor
```bash
npm start
```

Debería ver:
```
✅ Conectado a la base de datos SQLite
✅ Tablas verificadas/creadas
🚀 Servidor en puerto 3000
```

### 3️⃣ Abrir navegador
```
http://localhost:3000
```

---

## 📱 Interfaz (3 Pestañas)

### 🛒 Pestaña 1: Punto de Venta

**¿Qué hace?**
- Buscar productos por nombre/código
- Agregar al carrito
- Editar cantidades
- Cobrar venta

**Pasos**:
1. Escribe en "Buscar Productos"
2. Aparecen resultados
3. Click en "+ Agregar al carrito"
4. Se agrega con cantidad 1 (edita si necesitas más)
5. Click en "Cobrar Venta"
6. ✅ Venta registrada y stock actualizado

---

### 📦 Pestaña 2: Inventario

**¿Qué hace?**
- Ver todos los productos
- Crear nuevos productos
- Editar productos
- Eliminar productos

**Crear Producto**:
1. Rellena el formulario (Código, Nombre, Precio, Stock)
2. Click "Agregar Producto"
3. ✅ Aparece en la tabla

**Editar Producto**:
1. Click en botón "Edit" (lápiz)
2. Se abre modal
3. Cambia valores
4. Click "Guardar Cambios"
5. ✅ Actualizado

**Eliminar Producto**:
1. Click en botón "Delete" (papelera)
2. Confirma
3. ✅ Eliminado

---

### 📊 Pestaña 3: Reportes

**¿Qué ve?**
- Resumen del día (total ventas, ingresos, promedio)
- Historial de ventas recientes
- Top 10 productos más vendidos

**Ver Detalles de Venta**:
1. Click en botón "Visibility" en una venta
2. Se abre modal con detalles
3. Ver qué productos se vendieron
4. Cantidades y subtotales

---

## 🔍 Validaciones que Hace el Sistema

### Antes de Cobrar
```
✓ Carrito no esté vacío
✓ Producto exista en BD
✓ Stock sea suficiente
✓ Total > 0
```

Si falla: **Muestra error con explicación**

### Al Crear/Editar Producto
```
✓ Nombre no esté vacío
✓ Precio > 0
✓ Stock >= 0
✓ Código (si incluye) sea único
```

Si falla: **Muestra error específico**

---

## 🗄️ Base de Datos

**Tablas**:
- `productos`: Inventario
- `ventas`: Encabezado de ventas
- `detalles_venta`: Línea a línea

**Ubicación**: `backend/pos.db`

---

## 🐛 Si Algo Falla

### Error: "No se puede conectar al servidor"
```
❌ Asegúrate que corriste: npm start
❌ ¿Puerto 3000 está libre?
❌ Revisa la consola del servidor
```

### Error: "Stock insuficiente"
```
❌ El producto no tiene suficientes unidades
❌ Ve a Inventario y agrega más stock
```

### Error: "El código de barras ya existe"
```
❌ Ese código ya está registrado
❌ Usa otro código o edita el existente
```

### Error en la Venta
```
❌ Se revirtió automáticamente (ROLLBACK)
❌ Nada se guardó
❌ Revisa los datos e intenta de nuevo
```

---

## 💡 Consejos de Uso

1. **Busca rápido**: Escribe incluso parcialmente el nombre
2. **Edita cantidades**: Puedes cambiar cantidad en el carrito
3. **Limpiar carrito**: Si te equivocaste, limpie antes de cobrar
4. **Revisa stock**: Ve a Inventario si necesitas más productos
5. **Reportes**: Actualiza la página o cambia de tab para refrescar

---

## 📚 Documentación Completa

Lee: `REFACTORIZACION_v2.md` para detalles técnicos

---

**¿Preguntas?** Revisa los comentarios en el código (app.js, controllers, etc)


