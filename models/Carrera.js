const mongoose = require('mongoose');
const carreraSchema = new mongoose.Schema({
    nombre: String,
    facultad: String,
    activo: { type: Boolean, default: true }
}, { collection: 'Carreras' });
module.exports = mongoose.model('Carrera', carreraSchema);
