const mongoose = require('mongoose');

const pagoSchema = new mongoose.Schema({
  alumnoMatricula: { type: String, required: true, ref: 'Alumno' },
  concepto: { type: String, required: true },
  monto: { type: Number, required: true },
  fechaPago: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pagado', 'pendiente', 'vencido'], default: 'pendiente' }
}, { collection: 'Pagos' });

module.exports = mongoose.model('Pago', pagoSchema);
