const { estudianteConn } = require('../db/connections');
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

module.exports = estudianteConn.model('BoletaEstudiante', boletaSchema);
