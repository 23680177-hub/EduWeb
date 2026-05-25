const mongoose = require('mongoose');

const entregaSchema = new mongoose.Schema({
    tareaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tarea', required: true },
    alumnoMatricula: String,
    alumnoNombre: String,
    comentario: String,
    archivo: String,
    tareaTitulo: String,
    fechaEntrega: Date,
    calificacion: Number,
    retroalimentacion: String
}, { 
    collection: 'Entregas'   // ← nombre exacto
});

module.exports = mongoose.model('EntregaEstudiante', entregaSchema);
