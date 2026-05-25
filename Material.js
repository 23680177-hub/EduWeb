const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    claseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clase', required: true },
    titulo: String,
    tipo: String,
    url: String,
    descripcion: String
}, { 
    collection: 'Materiales'   // ← nombre exacto
});

module.exports = mongoose.model('Material', materialSchema);