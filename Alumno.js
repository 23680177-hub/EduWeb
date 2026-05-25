const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const alumnoSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    matricula: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    carrera: { type: String, default: '' },
    facultad: { type: String, default: '' },
    // Referencia al grupo actual del alumno
    grupoActual: { type: mongoose.Schema.Types.ObjectId, ref: 'Grupo', default: null },
    estado: { type: String, enum: ['activo', 'inactivo', 'graduado', 'baja'], default: 'activo' },
    estadoPago: { type: String, enum: ['Pagado', 'Pendiente'], default: 'Pendiente' },
    cargaAcademica: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materia' }],
    materiasReprobadas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Materia' }],
    reprobadasCount: { type: Number, default: 0 },
    telefono: { type: String, default: '' }
}, { 
    timestamps: true,
    collection: 'Alumnos'   // ← Nombre exacto de la colección en MongoDB
});

// Método para comparar contraseña
alumnoSchema.methods.comparePassword = async function(password) {
    return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('Alumno', alumnoSchema);