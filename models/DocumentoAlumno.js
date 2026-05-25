
const mongoose = require('mongoose');

const documentoAlumnoSchema = new mongoose.Schema({
  alumnoMatricula: String,
  tipo: { type: String, enum: ['credencial', 'historial', 'horario', 'otros'] },
  url: String, // ruta del archivo
  descripcion: String,
  fecha: { type: Date, default: Date.now }
}, { collection: 'Documentos-Alumno' });

module.exports = estudianteConn.model('DocumentoAlumno', documentoAlumnoSchema);
