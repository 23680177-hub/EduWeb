const mongoose = require('mongoose');

const boletaSchema = new mongoose.Schema({
    alumnoMatricula: { type: String, required: true },
    periodo: { type: String, required: true },      // ej: "2025-1"
    urlArchivo: { type: String, required: true },   // ruta del PDF
    fechaSubida: { type: Date, default: Date.now }
}, { collection: 'Boletas' });

module.exports = mongoose.model('Boleta', boletaSchema);
