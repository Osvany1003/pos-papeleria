const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");
const ventasRoutes = require("./routes/ventas");
const productosRoutes = require("./routes/productos");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ========== MIDDLEWARE ==========

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// ========== RUTAS ==========

// Ruta raíz
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// API - Ventas (Módulo transaccional)
app.use("/api/ventas", ventasRoutes);

// API - Productos (Módulo de inventario CRUD)
app.use("/api/productos", productosRoutes);

// ========== MANEJO DE ERRORES ==========

// 404 - Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ 
        error: "Ruta no encontrada", 
        path: req.path 
    });
});

// Manejo global de errores (debe ser el último middleware)
app.use((err, req, res, next) => {
    console.error("[ERROR]", err.message);
    res.status(err.status || 500).json({
        error: NODE_ENV === "production" ? "Error interno" : err.message
    });
});

// ========== INICIAR SERVIDOR ==========

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT} (${NODE_ENV})`);
    console.log(`📍 URL: http://localhost:${PORT}`);
});

module.exports = app;


