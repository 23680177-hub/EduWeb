// server.js (versión robusta para Render)
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Importar rutas con try-catch para identificar cuál falla
try {
    const authRoutes = require('./routes/auth');
    const adminRoutes = require('./routes/adminRoutes');
    const docenteRoutes = require('./routes/docenteRoutes');
    const estudianteRoutes = require('./routes/estudianteRoutes');

    app.use('/api/auth', authRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/admin', docenteRoutes);
    app.use('/api/estudiante', estudianteRoutes);
} catch (err) {
    console.error('❌ Error al cargar rutas:', err.message);
    process.exit(1);
}

// Conectar a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => {
      console.error('❌ Error conectando a Atlas:', err.message);
      process.exit(1);
  });

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en puerto ${PORT}`);
});
