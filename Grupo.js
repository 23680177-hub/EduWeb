const mongoose = require('mongoose');
const grupoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  carrera: { type: String, required: true },
  facultad: { type: String, required: true },
  horarioUrl: { type: String, default: '' },
  año: Number,
  activo: { type: Boolean, default: true }
}, { collection: 'Grupos' });
module.exports = mongoose.model('Grupo', grupoSchema);