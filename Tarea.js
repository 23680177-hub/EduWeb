const mongoose = require('mongoose');

const tareaSchema = new mongoose.Schema({
    claseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clase', required: true },
    titulo: { type: String, required: true },
    descripcion: String,
    fechaEntrega: Date
}, { 
    timestamps: true,
    collection: 'Tareas'   // ← nombre exacto de la colección en MongoDB
});

module.exports = mongoose.model('Tarea', tareaSchema);