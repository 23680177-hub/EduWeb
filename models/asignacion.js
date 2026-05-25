const mongoose = require('mongoose');

const asignacionSchema = new mongoose.Schema({
    docenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Docente' },
docenteMatricula: String,
  docenteNombre: String,
  materia: String,
  grupoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo' },
  grupoNombre: String,
  fecha: { type: Date, default: Date.now }
}, { collection: 'Asignaciones' });   // colección en plural

module.exports = mongoose.model('Asignacion', asignacionSchema);
