
const mongoose = require('mongoose');

const criteriosSchema = new mongoose.Schema({
  docenteMatricula: String,
  materia: String,
  grupoId: mongoose.Schema.Types.ObjectId,
  criterios: [{
    nombre: String,
    porcentaje: Number
  }]
}, { collection: 'Criterios-Evaluacion' });

module.exports = docenteConn.model('CriteriosEvaluacion', criteriosSchema);
