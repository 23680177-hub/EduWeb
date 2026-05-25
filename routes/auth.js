const express = require('express');
const bcrypt = require('bcryptjs');
const Administrador = require('../models/Administrador');
const Alumno = require('../models/Alumno');
const Docente = require('../models/Docente');
const router = express.Router();
const EstudianteDocente = require('../models/EstudianteDocente');

// Obtener el modelo según el rol
const getModel = (rol) => {
    if (rol === 'administrador') return Administrador;
    if (rol === 'alumno') return Alumno;
    if (rol === 'docente') return Docente;
    throw new Error('Rol inválido');
};

// ========== REGISTRO ==========
router.post('/register', async (req, res) => {
    try {
        const { rol, nombre, username, matricula, email, password } = req.body;
        const Model = getModel(rol);
        
        // Verificar unicidad según rol
        let existe;
        if (rol === 'administrador') {
            existe = await Model.findOne({ username });
        } else if (rol === 'alumno') {
            existe = await Model.findOne({ $or: [{ matricula }, { email }, { username }] });
        } else { // docente
            existe = await Model.findOne({ $or: [{ matricula }, { username }] });
        }
        
        if (existe) {
            return res.status(400).json({ error: 'El identificador ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let nuevoUsuario;

        if (rol === 'administrador') {
            nuevoUsuario = new Administrador({ nombre, username, password: hashedPassword });
        } else if (rol === 'alumno') {
            try {
        const estudianteDocente = new EstudianteDocente({
            nombre,
            matricula,
            email,
            username,
            password: hashedPassword,   // usa la misma contraseña encriptada
            carrera: carrera || '',
            facultad: facultad || '',
            grupoActual: grupoId || null,   // si el alumno tiene grupo asignado
            estado: 'activo'
        });
        await estudianteDocente.save();
    } catch (errDoc) {
        console.error('Error guardando en base docente:', errDoc);
        // No detenemos el proceso, solo registramos el error
    }

            nuevoUsuario = new Alumno({ nombre, matricula, email, username, password: hashedPassword });
        } else {
            nuevoUsuario = new Docente({ nombre, matricula, username, password: hashedPassword });
        }

        await nuevoUsuario.save();
        res.status(201).json({ mensaje: 'Registro exitoso' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
    try {
        const { identificador, password, rol } = req.body;
        const Model = getModel(rol);
        let usuario; // <--- DECLARADA AQUÍ

        // Buscar según el rol
        if (rol === 'administrador') {
            usuario = await Model.findOne({ username: identificador });
        } else if (rol === 'alumno') {
            usuario = await Model.findOne({ $or: [{ matricula: identificador }, { username: identificador }] });
        } else if (rol === 'docente') {
            usuario = await Model.findOne({ $or: [{ matricula: identificador }, { username: identificador }] });
        }

        if (!usuario) {
            return res.status(400).json({ error: 'Credenciales inválidas' });
        }

        const match = await bcrypt.compare(password, usuario.password);
        if (!match) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        // Respuesta exitosa
        const responseData = {
            _id: usuario._id,
            nombre: usuario.nombre,
            identificador: (rol === 'administrador') ? usuario.username : usuario.matricula,
            rol: rol
        };
        if (rol === 'alumno' && usuario.email) responseData.email = usuario.email;
        
        res.json(responseData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
