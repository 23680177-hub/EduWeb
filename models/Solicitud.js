const mongoose = require('mongoose');

const solicitudSchema = new mongoose.Schema({
  alumnoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', required: true },
  alumnoMatricula: String,
  alumnoNombre: String,
  materiaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia', required: true },
  materiaNombre: String,
  estado: { type: String, enum: ['pendiente', 'aprobada', 'rechazada'], default: 'pendiente' },
  fecha: { type: Date, default: Date.now }
},{ collection: 'Solicitudes' });

module.exports = mongoose.models.Solicitud || mongoose.model('Solicitud', solicitudSchema);
