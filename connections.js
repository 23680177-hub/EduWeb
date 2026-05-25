const mongoose = require('mongoose');

// Conexión para ADMIN
const adminConn = mongoose.createConnection('mongodb://localhost:27017/admin');
adminConn.on('error', console.error.bind(console, '❌ Error admin:'));
adminConn.once('open', () => console.log('✅ Conectado a base "admin"'));

// Conexión para DOCENTE
const docenteConn = mongoose.createConnection('mongodb://localhost:27017/docente');
docenteConn.on('error', console.error.bind(console, '❌ Error docente:'));
docenteConn.once('open', () => console.log('✅ Conectado a base "docente"'));

// Nueva conexión para ESTUDIANTE
const estudianteConn = mongoose.createConnection('mongodb://localhost:27017/estudiante');
estudianteConn.on('error', console.error.bind(console, '❌ Error estudiante:'));
estudianteConn.once('open', () => console.log('✅ Conectado a base "estudiante"'));

module.exports = { adminConn, docenteConn, estudianteConn };