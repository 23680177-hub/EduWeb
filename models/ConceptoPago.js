const mongoose = require('mongoose');

const conceptoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  monto: { type: Number, required: true },
  fechaCreacion: { type: Date, default: Date.now }
}, { collection: 'ConceptosPago' });

module.exports = mongoose.model('ConceptoPago', conceptoSchema);
