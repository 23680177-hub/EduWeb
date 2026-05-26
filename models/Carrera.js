const mongoose = require('mongoose');

const carreraSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    facultad: String,
    activo: { type: Boolean, default: true }
}, { collection: 'Carreras' });   // ← nombre exacto de la colección en Atlas

module.exports = mongoose.model('Carrera', carreraSchema);
