const mongoose = require('mongoose');

const asistenciaDocenteSchema = new mongoose.Schema({
  docenteMatricula: String,
  fecha: { type: Date, default: Date.now },
  entrada: Date,
  salida: Date,
  estado: String
}, { collection: 'Asistencias-Docentes' });

module.exports = docenteConn.model('AsistenciaDocente', asistenciaDocenteSchema);
