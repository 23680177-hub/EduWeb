const mongoose = require('mongoose');

const boletaSchema = new mongoose.Schema({
  alumnoMatricula: String,
  periodo: String,
  materias: [{
    nombre: String,
    calificacion: Number,
    promedio: Number
  }],
  promedioGeneral: Number,
  fecha: { type: Date, default: Date.now }
}, { collection: 'Boletas' });

module.exports = mongoose.model('BoletaEstudiante', boletaSchema);
