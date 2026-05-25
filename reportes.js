const express = require('express');
const Alumno = require('../models/Alumno');
const Docente = require('../models/Docente');
const Pago = require('../models/Pago');
const Asignacion = require('../models/asignacion');
const router = express.Router();

// KPIs
router.get('/dashboard/kpis', async (req, res) => {
  const totalAlumnos = await Alumno.countDocuments();
  const totalDocentes = await Docente.countDocuments();
  // Ejemplo: calcular morosidad como % de alumnos con pagos pendientes
  const totalAlumnosConDeuda = await Pago.distinct('alumnoMatricula', { estado: 'pendiente' }).then(arr => arr.length);
  const morosidad = totalAlumnos ? (totalAlumnosConDeuda / totalAlumnos * 100).toFixed(1) : 0;
  // Deserción: calcular según tu lógica (ej: alumnos sin pagos en últimos 3 meses)
  const desercion = 0; // implementar según criterio
  res.json({ totalAlumnos, totalDocentes, morosidad, desercion });
});

// Reporte de morosidad (lista de alumnos con adeudos)
router.get('/morosidad', async (req, res) => {
  const alumnosConDeuda = await Pago.aggregate([
    { $match: { estado: 'pendiente' } },
    { $group: { _id: '$alumnoMatricula', totalAdeudo: { $sum: '$monto' } } },
    { $lookup: { from: 'alumnos', localField: '_id', foreignField: 'matricula', as: 'alumno' } },
    { $unwind: '$alumno' },
    { $project: { matricula: '$_id', nombre: '$alumno.nombre', totalAdeudo: 1 } }
  ]);
  res.json(alumnosConDeuda);
});

// Estado de cuenta de un alumno
router.get('/estado-cuenta/:matricula', async (req, res) => {
  const pagos = await Pago.find({ alumnoMatricula: req.params.matricula }).sort({ fechaPago: -1 });
  const alumno = await Alumno.findOne({ matricula: req.params.matricula });
  if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
  res.json({ alumno: { nombre: alumno.nombre, matricula: alumno.matricula }, pagos });
});

// Reportes estadísticos (ejemplo académico)
router.get('/estadisticos', async (req, res) => {
  const tipo = req.query.tipo;
  if (tipo === 'academico') {
    // Aquí puedes agregar agregaciones de calificaciones cuando tengas colección de notas
    res.json({ promedioGeneral: 85, aprobados: 90, reprobados: 10 });
  } else if (tipo === 'asistencia') {
    res.json({ porcentajeAsistencia: 92 });
  } else if (tipo === 'desercion') {
    res.json({ tasaDesercion: 3.5 });
  } else {
    res.status(400).json({ error: 'Tipo no válido' });
  }
});

// Exportar datos (CSV)
router.get('/exportar', async (req, res) => {
  const { tipo, formato } = req.query;
  let data = [];
  if (tipo === 'alumnos') data = await Alumno.find({}, { nombre: 1, matricula: 1, email: 1, username: 1 });
  else if (tipo === 'docentes') data = await Docente.find({}, { nombre: 1, matricula: 1, username: 1 });
  else if (tipo === 'asignaciones') data = await Asignacion.find();
  else return res.status(400).json({ error: 'Tipo no soportado' });

  if (formato === 'csv' || formato === 'excel') {
    const csvHeader = Object.keys(data[0] || {}).join(',');
    const csvRows = data.map(row => Object.values(row).join(','));
    const csv = [csvHeader, ...csvRows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${tipo}.csv`);
    return res.send(csv);
  } else if (formato === 'pdf') {
    res.json({ mensaje: 'PDF aún no implementado, instala librería como pdfkit' });
  } else {
    res.status(400).json({ error: 'Formato no soportado' });
  }
});

// Reporte personalizado (ejecuta consulta JSON enviada)
router.post('/custom', async (req, res) => {
  try {
    const { coleccion, filtro } = req.body;
    let Model;
    if (coleccion === 'alumnos') Model = Alumno;
    else if (coleccion === 'docentes') Model = Docente;
    else if (coleccion === 'asignaciones') Model = Asignacion;
    else if (coleccion === 'pagos') Model = Pago;
    else return res.status(400).json({ error: 'Colección no válida' });
    const resultados = await Model.find(filtro || {});
    res.json(resultados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;