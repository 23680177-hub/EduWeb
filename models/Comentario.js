const mongoose = require('mongoose');

const comentarioSchema = new mongoose.Schema({
    claseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clase', required: true },
    autorMatricula: String,
    autorNombre: String,
    autorRol: String,
    texto: String,
    fecha: Date
}, { 
    collection: 'Comentarios'   // ← nombre exacto
});

module.exports = mongoose.model('Comentario', comentarioSchema);
