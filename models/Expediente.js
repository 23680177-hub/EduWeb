const mongoose = require('mongoose');
const expedienteSchema = new mongoose.Schema({
  alumnoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alumno', required: true },
  tipo: { type: String, enum: ['kardex', 'credencial', 'horario', 'acta', 'certificado', 'otros'], required: true },
  nombreArchivo: String,
  url: String,
  fechaSubida: { type: Date, default: Date.now },
  descripcion: String
}, { collection: 'Expedientes' });
module.exports = mongoose.model('Expediente', expedienteSchema);
