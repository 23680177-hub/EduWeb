const mongoose = require('mongoose');
const inscripcionSchema = new mongoose.Schema({
  alumnoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', required: true },
  grupoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo' },
  periodo: String,
  tipo: { type: String, enum: ['inscripcion', 'reinscripcion', 'traslado', 'baja', 'graduacion'], default: 'inscripcion' },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['activo', 'inactivo', 'egresado'], default: 'activo' },
  observaciones: String
}, { collection: 'Inscripciones' });
module.exports = mongoose.model('Inscripcion', inscripcionSchema);