const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Alumno = require('../models/Alumno');
const Docente = require('../models/Docente');
const Administrador = require('../models/Administrador');

// ========== REGISTRO ==========
router.post('/register', async (req, res) => {
    try {
        const { rol, nombre, username, matricula, email, password, carrera, facultad, grupoId } = req.body;

        // Validaciones básicas (puedes ampliarlas)
        if (!rol || !nombre || !username || !password) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }

        let Model;
        let existe;
        let hashed = await bcrypt.hash(password, 10);

        if (rol === 'administrador') {
            Model = Administrador;
            existe = await Model.findOne({ username });
            if (existe) return res.status(400).json({ error: 'Usuario ya existe' });
            const nuevo = new Model({ nombre, username, password: hashed });
            await nuevo.save();
            return res.status(201).json({ mensaje: 'Administrador creado' });

        } else if (rol === 'alumno') {
            if (!matricula || !email) {
                return res.status(400).json({ error: 'Matrícula y correo requeridos' });
            }
            Model = Alumno;
            existe = await Model.findOne({ $or: [{ matricula }, { email }, { username }] });
            if (existe) return res.status(400).json({ error: 'Matrícula, correo o usuario ya registrado' });
            const nuevoAlumno = new Alumno({
                nombre,
                matricula,
                email,
                username,
                password: hashed,
                carrera: carrera || '',
                facultad: facultad || '',
                grupoActual: grupoId || null,
                estado: 'activo',
                estadoPago: 'Pendiente'
            });
            await nuevoAlumno.save();
            return res.status(201).json({ mensaje: 'Alumno registrado exitosamente' });

        } else if (rol === 'docente') {
            if (!matricula) {
                return res.status(400).json({ error: 'Matrícula requerida' });
            }
            Model = Docente;
            existe = await Model.findOne({ $or: [{ matricula }, { username }] });
            if (existe) return res.status(400).json({ error: 'Matrícula o usuario ya registrado' });
            const nuevoDocente = new Docente({
                nombre,
                matricula,
                username,
                password: hashed,
                email: email || ''
            });
            await nuevoDocente.save();
            return res.status(201).json({ mensaje: 'Docente registrado exitosamente' });

        } else {
            return res.status(400).json({ error: 'Rol inválido' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ========== LOGIN ==========
router.post('/login', async (req, res) => {
    try {
        const { identificador, password, rol } = req.body;
        if (!identificador || !password || !rol) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        let Model;
        let usuario;

        if (rol === 'administrador') {
            Model = Administrador;
            usuario = await Model.findOne({ username: identificador });
        } else if (rol === 'alumno') {
            Model = Alumno;
            usuario = await Model.findOne({ $or: [{ matricula: identificador }, { email: identificador }, { username: identificador }] });
        } else if (rol === 'docente') {
            Model = Docente;
            usuario = await Model.findOne({ $or: [{ matricula: identificador }, { username: identificador }] });
        } else {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const isMatch = await bcrypt.compare(password, usuario.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Devolver datos de sesión (sin password)
        const { password: _, ...usuarioData } = usuario.toObject();
        res.json({
            ...usuarioData,
            rol,
            identificador: usuario.matricula || usuario.username
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
