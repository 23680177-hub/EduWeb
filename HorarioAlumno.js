const mongoose = require('mongoose');

const horarioAlumnoSchema = new mongoose.Schema({
    alumnoMatricula: { type: String, required: true },
    dia: { type: String, required: true },      // Lunes, Martes, Miércoles, Jueves, Viernes
    hora: { type: String, required: true },     // "7:00-9:00", "9:00-11:00", etc.
    materia: { type: String, required: true },
    salon: { type: String, default: '' }
}, { collection: 'HorarioAlumnos' });

module.exports = mongoose.model('HorarioAlumno', horarioAlumnoSchema);