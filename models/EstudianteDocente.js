// models/EstudianteDocente.js

const mongoose = require('mongoose');

const estudianteDocenteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  matricula: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },   // si quieres almacenar la misma contraseña
  carrera: String,
  facultad: String,
  grupoActual: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo' }, // referencia a grupo (admin)
  estado: { type: String, default: 'activo' },
  fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'Estudiantes' });

module.exports = docenteConn.model('EstudianteDocente', estudianteDocenteSchema);
