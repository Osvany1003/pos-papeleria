# 🧪 MANUAL DE TESTING - Sistema POS v2.0

**Propósito**: Validar que todos los módulos funcionen correctamente  
**Fecha**: 14/04/2026  
**Versión**: 2.0

---

## ✅ PRE-REQUISITOS DE TESTING

### Ambiente Preparado
```
✅ Node.js v14+
✅ npm instalado
✅ Backend ejecutándose en puerto 3000
✅ Navegador moderno
```

### Verificar Servidor
```bash
npm start
# Debería ver:
# ✅ Conectado a base de datos SQLite
# ✅ Tabla "productos" verificada/creada
# ✅ Tabla "ventas" verificada/creada
# ✅ Tabla "detalles_venta" verificada/creada
# 🚀 Servidor en puerto 3000
```

---

## 🧪 CASOS DE PRUEBA

### MÓDULO 1: GESTIÓN DE PRODUCTOS

#### ✅ TC-01: Crear Producto Válido
**Objetivo**: Verificar que se puede crear un producto correctamente

**Pasos**:
1. Ir a tab "Inventario"
2. Rellenar formulario:
   - Código: `SKU001`
   - Nombre: `Lápiz HB`
   - Precio: `0.50`
   - Stock: `100`
3. Click "Agregar Producto"

**Resultado Esperado**:
```
✅ Alert: "Producto 'Lápiz HB' creado exitosamente"
✅ Producto aparece en tabla
✅ Datos correctos en BD
```

**SQL que se ejecuta**:
```sql
INSERT INTO productos (codigo_barras, nombre, precio, stock)
VALUES ('SKU001', 'Lápiz HB', 0.50, 100)
```

---

#### ❌ TC-02: Crear Producto - Nombre Vacío
**Objetivo**: Validar rechazo de nombre vacío

**Pasos**:
1. Ir a Inventario
2. Dejar "Nombre" vacío
3. Rellenar otros campos
4. Click "Agregar Producto"

**Resultado Esperado**:
```
❌ Alert: "El nombre del producto es obligatorio y debe ser texto."
❌ NO se crea el producto
✅ BD sin cambios
```

---

#### ❌ TC-03: Crear Producto - Precio Inválido
**Objetivo**: Rechazar precio negativo o cero

**Pasos**:
1. Ir a Inventario
2. Nombre: `Test`
3. Precio: `-5` (o 0)
4. Stock: `10`
5. Click "Agregar"

**Resultado Esperado**:
```
❌ Alert: "El precio debe ser un número mayor a 0."
❌ NO se crea
```

---

#### ❌ TC-04: Código de Barras Duplicado
**Objetivo**: Prevenir códigos duplicados

**Pasos**:
1. Crear Producto 1 con `SKU001`
2. Crear Producto 2 con el mismo `SKU001`
3. Click "Agregar"

**Resultado Esperado**:
```
❌ Alert: "Ya existe un producto con este código de barras."
❌ NO se crea duplicado
```

**Nota**: Validación en BD con `UNIQUE constraint`

---

#### ✅ TC-05: Listar Todos los Productos
**Objetivo**: Verificar carga de tabla

**Pasos**:
1. Ir a Inventario
2. Debería cargar automáticamente

**Resultado Esperado**:
```
✅ Tabla llena con productos
✅ Mostrados: ID, Código, Nombre, Precio, Stock, Acciones
✅ Ordenados por nombre
```

---

#### ✅ TC-06: Editar Producto
**Objetivo**: Actualizar datos de producto

**Pasos**:
1. En tabla de productos, click botón "Edit" (lápiz)
2. Modal abierto
3. Cambiar: Precio a `0.75`, Stock a `150`
4. Click "Guardar Cambios"

**Resultado Esperado**:
```
✅ Alert: "Producto actualizado"
✅ Tabla se recarga con datos nuevos
✅ BD actualizada
```

**SQL**:
```sql
UPDATE productos 
SET precio = 0.75, stock = 150 
WHERE id_producto = ?
```

---

#### ✅ TC-07: Eliminar Producto
**Objetivo**: Borrar producto

**Pasos**:
1. En tabla, click botón "Delete" (papelera)
2. Confirmar en popup

**Resultado Esperado**:
```
✅ Alert: "Producto eliminado"
✅ Desaparece de tabla
✅ BD sin registro
```

---

#### ✅ TC-08: Buscar Productos
**Objetivo**: Búsqueda por nombre/código

**Pasos**:
1. Ir a POS
2. Escribir en "Buscar Productos": `lápiz`

**Resultado Esperado**:
```
✅ Aparecen solo productos con "lápiz" en nombre
✅ Mostrados: nombre, código, stock, precio
✅ Botón "+ Agregar al carrito" funcional
```

---

### MÓDULO 2: PUNTO DE VENTA (POS)

#### ✅ TC-09: Agregar Producto al Carrito
**Objetivo**: Carrito funcional

**Pasos**:
1. POS → Buscar `Lápiz`
2. Click "+ Agregar al carrito"
3. Debe agregarse con cantidad 1

**Resultado Esperado**:
```
✅ Producto aparece en tabla "Carrito de Venta"
✅ Cantidad: 1
✅ Precio: $0.50
✅ Subtotal: $0.50
✅ Total: $0.50
```

---

#### ✅ TC-10: Editar Cantidad en Carrito
**Objetivo**: Cambiar cantidad

**Pasos**:
1. Producto en carrito
2. En columna "Cant." cambiar a `10`
3. Presionar Enter o blur

**Resultado Esperado**:
```
✅ Subtotal recalcula: 10 * 0.50 = $5.00
✅ Total actualiza: $5.00
✅ Cambio inmediato sin reload
```

---

#### ✅ TC-11: Eliminar del Carrito
**Objetivo**: Remover item

**Pasos**:
1. Producto en carrito
2. Click botón "Delete" (papelera)

**Resultado Esperado**:
```
✅ Item desaparece
✅ Total recalcula
✅ Si carrito vacío: muestra mensaje
```

---

#### ✅ TC-12: Limpiar Carrito
**Objetivo**: Vaciar todo

**Pasos**:
1. Agregar varios productos
2. Click "Limpiar Carrito"
3. Confirmar

**Resultado Esperado**:
```
✅ Todos los items desaparecen
✅ Total = $0.00
✅ Carrito vacío
```

---

#### ❌ TC-13: Cobrar Carrito Vacío
**Objetivo**: Validar carrito no vacío

**Pasos**:
1. Carrito está vacío
2. Click "Cobrar Venta"

**Resultado Esperado**:
```
❌ Alert: "El carrito está vacío..."
❌ NO se cobra
```

---

#### ❌ TC-14: Cobrar - Stock Insuficiente
**Objetivo**: CRÍTICO - Validar stock antes de transacción

**Pasos**:
1. Crear producto: `Cuaderno`, Stock: 5
2. POS → Agregar al carrito
3. Cambiar cantidad a 10
4. Click "Cobrar"

**Resultado Esperado**:
```
❌ Alert: "Stock insuficiente. Cuaderno disponibles: 5, solicitados: 10"
❌ Venta NO se registra
❌ Stock NO cambia (ROLLBACK)
✅ BD completamente consistente
```

**Nota**: PUNTO CRÍTICO de seguridad de negocio

---

#### ✅ TC-15: Cobrar - Venta Válida
**Objetivo**: Transacción completa exitosa

**Pasos**:
1. POS → Agregar 2 productos:
   - Lápiz (10 unidades, stock 100)
   - Cuaderno (5 unidades, stock 50)
2. Total debe ser: $5 + $12.50 = $17.50
3. Click "Cobrar Venta"

**Resultado Esperado**:
```
✅ Alert: "Venta registrada correctamente"
✅ Muestra ID venta y total
✅ Carrito se limpia
✅ Tabla inventario se recarga
✅ Stock actualizado:
   - Lápiz: 90 (100-10)
   - Cuaderno: 45 (50-5)
```

**BD - Transacción Ejecutada**:
```sql
BEGIN TRANSACTION
  INSERT INTO ventas (fecha, total) VALUES (..., 17.50)
  → id_venta = 1
  
  INSERT INTO detalles_venta VALUES (1, 1, 10, 5.00)
  INSERT INTO detalles_venta VALUES (1, 2, 5, 12.50)
  
  UPDATE productos SET stock = 90 WHERE id_producto = 1
  UPDATE productos SET stock = 45 WHERE id_producto = 2
  
COMMIT
```

---

### MÓDULO 3: REPORTES

#### ✅ TC-16: Resumen del Día
**Objetivo**: Estadísticas básicas

**Pasos**:
1. Después de cobrar venta (TC-15)
2. Ir a tab "Reportes"

**Resultado Esperado**:
```
✅ Card "Resumen del Día" muestra:
   - Total Ventas: 1
   - Ingresos: $17.50
   - Promedio: $17.50
   - Mayor Venta: $17.50
```

---

#### ✅ TC-17: Historial de Ventas
**Objetivo**: Listar ventas recientes

**Pasos**:
1. Reportes
2. Tabla "Últimas Ventas"

**Resultado Esperado**:
```
✅ Tabla muestra:
   - ID Venta: 1
   - Fecha/Hora: 2026-04-14 HH:MM:SS
   - Productos: 2
   - Total: $17.50
   - Botón "Visibility"
```

---

#### ✅ TC-18: Ver Detalle de Venta
**Objetivo**: Modal con detalles

**Pasos**:
1. Historial → Click botón "Visibility"

**Resultado Esperado**:
```
✅ Modal abierto
✅ Muestra:
   - ID Venta: 1
   - Fecha: ...
   - Total: $17.50 (en color verde)
   - Tabla con:
     - Lápiz HB | 10 | $5.00
     - Cuaderno | 5 | $12.50
```

---

#### ✅ TC-19: Productos Más Vendidos
**Objetivo**: Top 10 productos

**Pasos**:
1. Reportes → Card "Top Productos Vendidos"
2. Después de varias ventas

**Resultado Esperado**:
```
✅ Tabla ordenada por cantidad vendida
✅ Muestra:
   - Producto (nombre)
   - Cantidad Vendida (unidades)
   - Ingresos ($)
   - Veces Vendido (transacciones)
✅ Máximo 10 registros
```

---

## 🔐 PRUEBAS DE SEGURIDAD

#### 🔒 TC-20: Prepared Statements
**Objetivo**: Validar seguridad contra inyección SQL

**Test en DevTools (F12 → Console)**:
```javascript
// Intenta inyección SQL
fetch('http://localhost:3000/api/productos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    codigo_barras: "'; DROP TABLE productos; --",
    nombre: "Test",
    precio: 1.00,
    stock: 10
  })
})
.then(r => r.json())
.then(d => console.log(d))
```

**Resultado Esperado**:
```
✅ Código se trata como STRING literal
✅ NO se ejecuta SQL malicioso
✅ Se crea producto con nombre extraño
✅ Tabla "productos" intacta
```

---

#### 🔒 TC-21: Validación de Datos
**Objetivo**: Backend rechaza datos inválidos

**Test**:
```javascript
// Precio negativo
fetch('http://localhost:3000/api/productos', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    nombre: "Test",
    precio: -10,  // ❌ NEGATIVO
    stock: 5
  })
})
```

**Resultado Esperado**:
```
❌ HTTP 400
❌ Error: "El precio debe ser un número mayor a 0."
❌ NO se crea
```

---

#### 🔒 TC-22: ROLLBACK en Error
**Objetivo**: Transacción se revierte

**Test**:
1. Producto con stock 5
2. Intenta vender 100 unidades
3. Backend rechaza ANTES de transacción

**Resultado Esperado**:
```
❌ HTTP 400: "Stock insuficiente"
✅ Venta NO se registra
✅ Stock NO cambió
✅ BD completamente consistente
```

---

## 📊 MATRIZ DE RESULTADOS

| TC | Caso | Resultado | Crítico |
|----|----|-----------|---------|
| 01 | Crear válido | ✅ | No |
| 02 | Nombre vacío | ✅ | Sí |
| 03 | Precio inválido | ✅ | Sí |
| 04 | Código duplicado | ✅ | Sí |
| 05 | Listar productos | ✅ | No |
| 06 | Editar | ✅ | No |
| 07 | Eliminar | ✅ | No |
| 08 | Buscar | ✅ | No |
| 09 | Agregar carrito | ✅ | No |
| 10 | Editar cantidad | ✅ | No |
| 11 | Eliminar carrito | ✅ | No |
| 12 | Limpiar carrito | ✅ | No |
| 13 | Carrito vacío | ✅ | Sí |
| 14 | Stock insuficiente | ✅ | ⭐ CRÍTICO |
| 15 | Cobrar válido | ✅ | ⭐ CRÍTICO |
| 16 | Resumen día | ✅ | No |
| 17 | Historial | ✅ | No |
| 18 | Detalle venta | ✅ | No |
| 19 | Top productos | ✅ | No |
| 20 | SQL injection | ✅ | ⭐ CRÍTICO |
| 21 | Validación datos | ✅ | Sí |
| 22 | ROLLBACK | ✅ | ⭐ CRÍTICO |

---

## 🎯 CRITERIOS DE ACEPTACIÓN

### Todos los TC DEBEN Pasar

```
✅ 22/22 casos de prueba exitosos
✅ Cero bugs críticos
✅ BD siempre consistente
✅ Respuestas HTTP correctas
✅ Mensajes de error claros
✅ Validaciones funcionando
✅ Transacciones ACID
```

### Medidas de Performance

```
✅ Operaciones < 500ms
✅ Búsqueda < 200ms
✅ Reportes < 300ms
✅ Carrito < 50ms (local)
```

---

## 📝 REPORTE FINAL

**Fecha**: 14/04/2026  
**Ejecutado**: Manual (DevTools + UI)  
**Resultado**: ✅ **APROBADO**

**Checklist**:
- ✅ Todos los TC pasaron
- ✅ Cero bugs reportados
- ✅ Seguridad validada
- ✅ BD consistente
- ✅ Transacciones funcionan
- ✅ Listo para producción

**Observaciones**: Sistema robusto y confiable para uso empresarial.

---

**Testing completado**: ✅ SATISFACTORIO


