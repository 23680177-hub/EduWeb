const express = require('express');
const router = express.Router();
const Asignacion = require('../models/asignacion');

// Obtener todas las asignaciones
router.get('/', async (req, res) => {
  const asignaciones = await Asignacion.find();
  res.json(asignaciones);
});

// Crear nueva asignación
router.post('/', async (req, res) => {
  try {
    const nueva = new Asignacion(req.body);
    await nueva.save();
    res.status(201).json(nueva);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
