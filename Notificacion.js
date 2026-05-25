const { estudianteConn } = require('../db/connections');
const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
  alumnoMatricula: String,
  titulo: String,
  mensaje: String,
  leida: { type: Boolean, default: false },
  fecha: { type: Date, default: Date.now }
}, { collection: 'Notificaciones' });

module.exports = estudianteConn.model('Notificacion', notificacionSchema);