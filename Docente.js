const mongoose = require('mongoose');

const docenteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  matricula: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'Docentes' });   // colección en plural

module.exports = mongoose.model('Docente', docenteSchema);