const mongoose = require('mongoose');

const materiaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  codigo: { type: String, required: true, unique: true },
  creditos: { type: Number, default: 3 }
},{ collection: 'Materias' });

module.exports = mongoose.models.Materia ||mongoose.model('Materia', materiaSchema);