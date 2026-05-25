const { adminConn } = require('../db/connections');

const mongoose = require('mongoose');

const administradorSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fechaRegistro: { type: Date, default: Date.now }
}, { collection: 'Administradores' });

module.exports = mongoose.model('Administrador', administradorSchema);
