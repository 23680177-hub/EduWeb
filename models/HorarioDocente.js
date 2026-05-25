
const mongoose = require('mongoose');

const horarioDocenteSchema = new mongoose.Schema({
  docenteMatricula: String,
  dia: String,
  hora: String,
  materia: String,
  grupoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo' }
}, { collection: 'Horario-Docente' });

module.exports = mongoose.model('HorarioDocente', horarioDocenteSchema);
