const mongoose = require('mongoose');

const claseSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    materia: { type: String, required: true },
    grupoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo' },
    docenteMatricula: String,
    descripcion: String,
    limiteEstudiantes: Number,
    estudiantesInscritos: [String]   // ← array de matrículas
}, { 
    collection: 'Clases' 
});

module.exports = mongoose.model('Clase', claseSchema);
