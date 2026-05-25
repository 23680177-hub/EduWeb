const express = require('express');
const router = express.Router();
const Entrega = require('../models/Entrega');
const Tarea = require('../models/Tarea');
const Alumno = require('../models/Alumno');

// Obtener todas las entregas del estudiante (historial)
router.get('/entregas', async (req, res) => {
    try {
        const { matricula } = req.query;
        if (!matricula) {
            return res.status(400).json({ error: 'Matrícula requerida' });
        }
        const entregas = await Entrega.find({ alumnoMatricula: matricula }).sort({ fechaEntrega: -1 });
        res.json(entregas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Obtener boletas (promedios por período) - ejemplo básico


// Obtener calificaciones detalladas (para la pestaña "Calificaciones")
router.get('/calificaciones', async (req, res) => {
    try {
        const { matricula } = req.query;
        if (!matricula) {
            return res.status(400).json({ error: 'Matrícula requerida' });
        }
        const entregas = await Entrega.find({ 
            alumnoMatricula: matricula, 
            calificacion: { $ne: null } 
        }).select('tareaTitulo calificacion retroalimentacion fechaEntrega');
        res.json(entregas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
