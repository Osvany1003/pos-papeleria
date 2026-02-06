const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");
const ventasRoutes = require("./routes/ventas");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// Ruta raíz
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.use("/api/ventas", ventasRoutes);

// 404
app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada", path: req.path });
});

// Manejo global de errores
app.use((err, req, res, next) => {
    console.error("[ERROR]", err.message);
    res.status(err.status || 500).json({
        error: NODE_ENV === "production" ? "Error interno" : err.message
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor en puerto ${PORT} (${NODE_ENV})`);
});
