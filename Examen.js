const { docenteConn } = require('../db/connections');
const mongoose = require('mongoose');

const examenSchema = new mongoose.Schema({
  claseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Clase', required: true },
  titulo: String,
  preguntas: [{
    texto: String,
    tipo: { type: String, enum: ['multiple', 'texto'] },
    opciones: [String], // solo para multiple
    respuestaCorrecta: mongoose.Schema.Types.Mixed // para multiple, índice; para texto, string
  }],
  fechaDisponible: Date,
  fechaCierre: Date,
  intentosPermitidos: { type: Number, default: 1 }
}, { collection: 'Examenes' });

module.exports = docenteConn.model('Examen', examenSchema);