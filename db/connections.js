// server.js - Listo para despliegue en Render
require('dotenv').config(); // Opcional, Render inyecta variables de entorno directamente
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar rutas
require('./db/connections'); // Si este archivo existe y no causa conflictos, se mantiene
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/adminRoutes');
const docenteRoutes = require('./routes/docenteRoutes');
const estudianteRoutes = require('./routes/estudianteRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Servir archivos estáticos (HTML, CSS, JS del frontend)
// Crea una carpeta 'public' en la raíz y coloca dentro tus archivos:
//   - Sistema_Gestion_Escolar.html
//   - estudiante.html
//   - docente.html
//   - fondo.png (si lo usas)
app.use(express.static('public'));

// Conectar a MongoDB Atlas usando la variable de entorno (Render la inyecta)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a Atlas:', err));

// Registrar rutas API
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', docenteRoutes);       // Las rutas de docente van bajo /api/admin
app.use('/api/estudiante', estudianteRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

// Puerto (Render asigna process.env.PORT automáticamente)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
});
