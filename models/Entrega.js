const mongoose = require('mongoose');

const entregaSchema = new mongoose.Schema({
  tareaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tarea', required: true },
  alumnoMatricula: { type: String, required: true },
  alumnoNombre: String,
  archivo: String,
  comentario: String,
  calificacion: { type: Number, default: null },
  retroalimentacion: String,
  fechaEntrega: { type: Date, default: Date.now },
  estado: { type: String, enum: ['entregado', 'calificado', 'revisado'], default: 'entregado' }
}, { collection: 'Entregas' });

module.exports = mongoose.model('Entrega', entregaSchema);
