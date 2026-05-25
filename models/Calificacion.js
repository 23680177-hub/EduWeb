const mongoose = require('mongoose');

const calificacionSchema = new mongoose.Schema({
  docenteMatricula: String,
  materia: String,
  grupoId: mongoose.Schema.Types.ObjectId,
  alumnoMatricula: String,
  tipo: { type: String, enum: ['parcial1', 'parcial2', 'parcial3', 'examen', 'tarea', 'proyecto'] },
  calificacion: Number,
  comentario: { type: String, default: '' },  // Nuevo campo
  fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'Calificaciones' });

module.exports = mongoose.model('Calificacion', calificacionSchema);
