const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Modelos
const Carrera = require('../models/Carrera');
const Alumno = require('../models/Alumno');
const Docente = require('../models/Docente');
const Grupo = require('../models/Grupo');
const Materia = require('../models/Materia');
const Solicitud = require('../models/Solicitud');
const Asignacion = require('../models/asignacion');
const ConceptoPago = require('../models/ConceptoPago');
const Pago = require('../models/Pago');
const AsistenciaDocente = require('../models/AsistenciaDocente');
const Tarea = require('../models/Tarea');
const Comentario = require('../models/Comentario');
const Material = require('../models/Material');
const Entrega = require('../models/Entrega');
const Clase = require('../models/Clase');
const HorarioAlumno = require('../models/HorarioAlumno');
const Boleta = require('../models/Boleta');

// ========== DASHBOARD / KPIs ==========
router.get('/dashboard/kpis', async (req, res) => {
    try {
        const totalAlumnos = await Alumno.countDocuments();
        const totalDocentes = await Docente.countDocuments();
        const alumnosMorosos = await Alumno.countDocuments({ estadoPago: 'Pendiente' });
        const morosidad = totalAlumnos === 0 ? 0 : (alumnosMorosos / totalAlumnos) * 100;
        const alumnosInactivos = await Alumno.countDocuments({ estado: { $ne: 'activo' } });
        const desercion = totalAlumnos === 0 ? 0 : (alumnosInactivos / totalAlumnos) * 100;
        res.json({
            totalAlumnos,
            totalDocentes,
            morosidad: parseFloat(morosidad.toFixed(2)),
            desercion: parseFloat(desercion.toFixed(2))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== MATERIAS ==========
router.get('/materias', async (req, res) => {
    const materias = await Materia.find();
    res.json(materias);
});
router.post('/materias', async (req, res) => {
    const { nombre, codigo, creditos } = req.body;
    const nueva = new Materia({ nombre, codigo, creditos });
    await nueva.save();
    res.status(201).json(nueva);
});
router.delete('/materias/:id', async (req, res) => {
    await Materia.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminada' });
});
router.post('/solicitudes', async (req, res) => {
    try {
        const { alumnoId, materiaId } = req.body;
        const alumno = await Alumno.findById(alumnoId);
        const materia = await Materia.findById(materiaId);
        if (!alumno || !materia) {
            return res.status(404).json({ error: 'Alumno o materia no encontrados' });
        }
        const existe = await Solicitud.findOne({ alumnoId, materiaId, estado: 'pendiente' });
        if (existe) {
            return res.status(400).json({ error: 'Ya tienes una solicitud pendiente' });
        }
        const solicitud = new Solicitud({
            alumnoId: alumno._id,
            alumnoMatricula: alumno.matricula,
            alumnoNombre: alumno.nombre,
            materiaId: materia._id,
            materiaNombre: materia.nombre,
            estado: 'pendiente',
            fecha: new Date()
        });
        await solicitud.save();
        res.status(201).json(solicitud);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== SOLICITUDES ==========
router.get('/solicitudes', async (req, res) => {
    try {
        const { estado, matricula, alumnoId } = req.query;
        let filtro = {};
        if (estado) filtro.estado = estado;
        else filtro.estado = 'pendiente';
        if (matricula) filtro.alumnoMatricula = matricula;
        if (alumnoId) filtro.alumnoId = alumnoId;
        const solicitudes = await Solicitud.find(filtro).sort({ fecha: -1 });
        res.json(solicitudes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/solicitudes/:id/aprobar', async (req, res) => {
    try {
        const solicitud = await Solicitud.findById(req.params.id);
        if (!solicitud) return res.status(404).json({ error: 'No encontrada' });
        solicitud.estado = 'aprobada';
        await solicitud.save();
        await Alumno.findByIdAndUpdate(solicitud.alumnoId, {
            $addToSet: { cargaAcademica: solicitud.materiaId }
        });
        res.json({ mensaje: 'Aprobada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/solicitudes/:id/rechazar', async (req, res) => {
    try {
        await Solicitud.findByIdAndUpdate(req.params.id, { estado: 'rechazada' });
        res.json({ mensaje: 'Rechazada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/alumnos/:id/limite', async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id).populate('cargaAcademica materiasReprobadas');
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
        const reprobadas = alumno.reprobadasCount || alumno.materiasReprobadas?.length || 0;
        const limite = reprobadas > 2 ? 7 : 8;
        const materiasCargadas = alumno.cargaAcademica?.length || 0;
        res.json({
            limiteTotal: limite,
            materiasCargadas: materiasCargadas,
            disponibles: limite - materiasCargadas,
            reprobadas: reprobadas
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== ALUMNOS ==========
const normalizeGrupoActual = (value) => {
    if (value === undefined || value === null || value === '' || value === 'undefined') return null;
    return value;
};

router.get('/alumnos', async (req, res) => {
    const { matricula, nombre } = req.query;
    let filtro = {};
    if (matricula) filtro.matricula = matricula;
    if (nombre) filtro.nombre = new RegExp(nombre, 'i');
    const alumnos = await Alumno.find(filtro).populate('grupoActual');
    res.json(alumnos);
});
router.post('/alumnos', async (req, res) => {
    let { nombre, matricula, email, username, password, carrera, facultad, grupoActual } = req.body;
    grupoActual = normalizeGrupoActual(grupoActual);
    const existe = await Alumno.findOne({ $or: [{ matricula }, { email }, { username }] });
    if (existe) return res.status(400).json({ error: 'Ya existe' });
    const hashed = await require('bcryptjs').hash(password, 10);
    const nuevo = new Alumno({ nombre, matricula, email, username, password: hashed, carrera, facultad, grupoActual });
    await nuevo.save();
    res.status(201).json(nuevo);
});
router.put('/alumnos/:id', async (req, res) => {
    let updates = req.body;
    delete updates.password;
    if (updates.grupoActual !== undefined) {
        updates.grupoActual = normalizeGrupoActual(updates.grupoActual);
    }
    const alumno = await Alumno.findByIdAndUpdate(req.params.id, updates, { returnDocument: 'after' });
    res.json(alumno);
});
router.delete('/alumnos/:id', async (req, res) => {
    await Alumno.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminado' });
});
router.get('/alumnos/:id', async (req, res) => {
    try {
        const alumno = await Alumno.findById(req.params.id).select('-password').populate('grupoActual');
        if (!alumno) return res.status(404).json({ error: 'Estudiante no encontrado' });
        res.json(alumno);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.patch('/alumnos/:id/pago', async (req, res) => {
    try {
        const { estadoPago } = req.body;
        if (!['Pagado', 'Pendiente'].includes(estadoPago)) {
            return res.status(400).json({ error: 'Estado inválido' });
        }
        const alumno = await Alumno.findByIdAndUpdate(
            req.params.id,
            { estadoPago },
            { returnDocument: 'after' }
        );
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
        res.json({ mensaje: 'Estado de pago actualizado', estadoPago: alumno.estadoPago });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/alumnos/:id/inscripcion', async (req, res) => {
    const { tipo, periodo, grupoId, observaciones } = req.body;
    if (grupoId) await Alumno.findByIdAndUpdate(req.params.id, { grupoActual: normalizeGrupoActual(grupoId) });
    res.json({ mensaje: 'Registrado' });
});
router.get('/alumnos/:id/documentos', async (req, res) => { res.json([]); });
router.post('/alumnos/:id/documentos', async (req, res) => { res.json({ mensaje: 'Documento subido' }); });
router.get('/alumnos/:id/carga', async (req, res) => {
    const alumno = await Alumno.findById(req.params.id).populate('cargaAcademica');
    res.json(alumno.cargaAcademica || []);
});
// ========== CARRERAS (para selects) ==========
router.get('/carrera', async (req, res) => {
    const carrera = await Carrera.find({ activo: true });
    res.json(carreras.map(c => c.nombre));
});
// ========== GRUPOS ==========
const storageHorario = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/horarios/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const uploadHorario = multer({ storage: storageHorario });

router.post('/grupos/:id/horario', uploadHorario.single('horario'), async (req, res) => {
    try {
        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
        if (req.file) {
            grupo.horarioUrl = `/uploads/horarios/${req.file.filename}`;
            await grupo.save();
        }
        res.json({ mensaje: 'Horario actualizado', horarioUrl: grupo.horarioUrl });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.patch('/grupos/:id/estado', async (req, res) => {
    try {
        const { estado } = req.body;
        const activo = estado === 'activo';
        const grupo = await Grupo.findByIdAndUpdate(req.params.id, { activo }, { returnDocument: 'after' });
        res.json({ mensaje: 'Estado actualizado', activo: grupo.activo });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/grupos', async (req, res) => {
    const grupos = await Grupo.find();
    res.json(grupos);
});
router.post('/grupos', async (req, res) => {
    const grupo = new Grupo(req.body);
    await grupo.save();
    res.json(grupo);
});
router.put('/grupos/:id', async (req, res) => {
    const grupo = await Grupo.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
    res.json(grupo);
});
router.delete('/grupos/:id', async (req, res) => {
    await Grupo.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminado' });
});
router.get('/grupos/:id', async (req, res) => {
    try {
        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
        res.json(grupo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/grupos/:id/estudiantes', async (req, res) => {
    try {
        const estudiantes = await Alumno.find({ grupoActual: req.params.id }).select('-password');
        res.json(estudiantes);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/grupos/:id/estudiantes', async (req, res) => {
    try {
        const { estudianteIds } = req.body;
        if (!estudianteIds || !Array.isArray(estudianteIds) || estudianteIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de estudianteIds' });
        }
        const grupo = await Grupo.findById(req.params.id);
        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
        const result = await Alumno.updateMany(
            { _id: { $in: estudianteIds } },
            { grupoActual: req.params.id }
        );
        res.json({ mensaje: `${result.modifiedCount} estudiante(s) asignado(s) al grupo` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/grupos/:id/estudiantes/:estudianteId', async (req, res) => {
    try {
        const estudiante = await Alumno.findById(req.params.estudianteId);
        if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado' });
        if (estudiante.grupoActual?.toString() !== req.params.id) {
            return res.status(400).json({ error: 'El estudiante no pertenece a este grupo' });
        }
        estudiante.grupoActual = null;
        await estudiante.save();
        res.json({ mensaje: 'Estudiante removido del grupo' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== TAREAS ==========
router.get('/clases/:id/tareas', async (req, res) => {
    try {
        const tareas = await Tarea.find({ claseId: req.params.id }).sort({ fechaEntrega: 1 });
        res.json(tareas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/tareas', async (req, res) => {
    try {
        const { claseId, titulo, descripcion, fechaEntrega } = req.body;
        const nuevaTarea = new Tarea({ claseId, titulo, descripcion, fechaEntrega });
        await nuevaTarea.save();
        res.status(201).json(nuevaTarea);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/tareas/:id', async (req, res) => {
    try {
        const { titulo, descripcion, fechaEntrega } = req.body;
        const tarea = await Tarea.findByIdAndUpdate(req.params.id, { titulo, descripcion, fechaEntrega }, { new: true });
        res.json(tarea);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/tareas/:id', async (req, res) => {
    try {
        await Tarea.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Tarea eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== COMENTARIOS ==========
router.get('/clases/:id/comentarios', async (req, res) => {
    try {
        const comentarios = await Comentario.find({ claseId: req.params.id }).sort({ fecha: -1 });
        res.json(comentarios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/comentarios', async (req, res) => {
    try {
        const { claseId, autorMatricula, autorNombre, autorRol, texto } = req.body;
        const nuevo = new Comentario({ claseId, autorMatricula, autorNombre, autorRol, texto, fecha: new Date() });
        await nuevo.save();
        res.status(201).json(nuevo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== MATERIALES ==========
router.get('/clases/:id/materiales', async (req, res) => {
    try {
        const materiales = await Material.find({ claseId: req.params.id });
        res.json(materiales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/docente/materiales', async (req, res) => {
    try {
        const { claseId, titulo, tipo, enlace, descripcion } = req.body;
        const nuevoMaterial = new Material({ claseId, titulo, tipo, url: enlace, descripcion });
        await nuevoMaterial.save();
        res.status(201).json(nuevoMaterial);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== ENTREGAS ==========
router.get('/tareas/:id/entregas', async (req, res) => {
    try {
        const entregas = await Entrega.find({ tareaId: req.params.id });
        res.json(entregas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/entregas', uploadHorario.single('archivo'), async (req, res) => {
    try {
        const { tareaId, alumnoMatricula, alumnoNombre, comentario, tareaTitulo } = req.body;
        let archivoUrl = null;
        if (req.file) {
            archivoUrl = `/uploads/entregas/${req.file.filename}`;
        }
        const entrega = new Entrega({
            tareaId,
            alumnoMatricula,
            alumnoNombre,
            comentario,
            archivo: archivoUrl,
            tareaTitulo,
            fechaEntrega: new Date()
        });
        await entrega.save();
        res.status(201).json(entrega);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.put('/entregas/:id', async (req, res) => {
    try {
        const { calificacion, retroalimentacion } = req.body;
        const entrega = await Entrega.findByIdAndUpdate(req.params.id, { calificacion, retroalimentacion }, { new: true });
        res.json(entrega);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== CONCEPTOS DE PAGO ==========
router.get('/conceptos', async (req, res) => {
    const conceptos = await ConceptoPago.find();
    res.json(conceptos);
});
router.post('/conceptos', async (req, res) => {
    const { agregar, conceptos } = req.body;
    if (agregar) {
        const nuevo = new ConceptoPago(agregar);
        await nuevo.save();
    } else if (conceptos) {
        await ConceptoPago.deleteMany({});
        await ConceptoPago.insertMany(conceptos);
    }
    res.json({ mensaje: 'ok' });
});
router.delete('/conceptos/:id', async (req, res) => {
    await ConceptoPago.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'eliminado' });
});

// ========== PAGOS ==========
router.get('/pagos', async (req, res) => {
    const { matricula } = req.query;
    let filtro = {};
    if (matricula) filtro.alumnoMatricula = matricula;
    const pagos = await Pago.find(filtro).sort({ fechaPago: -1 });
    const pagosConFecha = pagos.map(p => ({ ...p.toObject(), fecha: p.fechaPago }));
    res.json(pagosConFecha);
});
router.post('/pagos', async (req, res) => {
    try {
        let { alumnoMatricula, alumnoId, concepto, monto, fechaPago } = req.body;
        if (!alumnoMatricula || !alumnoId || !concepto || !monto) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }
        let fechaPagoObj = fechaPago ? new Date(fechaPago) : new Date();
        if (isNaN(fechaPagoObj.getTime())) fechaPagoObj = new Date();
        const pago = new Pago({ alumnoMatricula, alumnoId, concepto, monto: Number(monto), fechaPago: fechaPagoObj, estado: 'pagado' });
        await pago.save();
        res.status(201).json(pago);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/pagos/pendientes/:matricula', async (req, res) => { res.json([]); });

// ========== REPORTES ==========
router.get('/reportes/graficos', async (req, res) => {
    res.json({
        ingresosMensuales: { labels: ['Ene','Feb','Mar'], values: [12000,15000,18000] },
        morosidadCarreras: { labels: ['Computación','Civil'], values: [15,8] }
    });
});
router.get('/reportes/alumnos', async (req, res) => {
    const { matricula, nombre, carrera } = req.query;
    let filtro = {};
    if (matricula) filtro.matricula = matricula;
    if (nombre) filtro.nombre = new RegExp(nombre, 'i');
    if (carrera) filtro.carrera = carrera;
    const alumnos = await Alumno.find(filtro).populate('grupoActual');
    const resultado = alumnos.map(a => ({
        matricula: a.matricula,
        nombre: a.nombre,
        carrera: a.carrera,
        grupo: a.grupoActual?.nombre || '',
        estado: a.estado
    }));
    res.json(resultado);
});
router.get('/reportes/estudiantes', async (req, res) => {
    const alumnos = await Alumno.find().populate('grupoActual');
    res.json(alumnos);
});
router.get('/reportes/ingresos-mensuales', async (req, res) => {
    try {
        const pipeline = [
            { $match: { estado: 'pagado' } },
            { $group: { _id: { year: { $year: "$fechaPago" }, month: { $month: "$fechaPago" } }, total: { $sum: "$monto" } } },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ];
        const pagos = await Pago.aggregate(pipeline);
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const labels = pagos.map(p => `${months[p._id.month-1]} ${p._id.year}`);
        const values = pagos.map(p => p.total);
        res.json({ labels, values });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular los ingresos mensuales' });
    }
});
router.get('/reportes/morosidad-carreras', async (req, res) => {
    try {
        const pipeline = [
            { $group: { _id: { carrera: "$carrera", estadoPago: "$estadoPago" }, count: { $sum: 1 } } },
            { $group: { _id: "$_id.carrera", total: { $sum: "$count" }, morosos: { $sum: { $cond: [ { $eq: [ "$_id.estadoPago", "Pendiente" ] }, "$count", 0 ] } } } },
            { $project: { carrera: "$_id", porcentaje: { $multiply: [ { $divide: [ "$morosos", "$total" ] }, 100 ] } } }
        ];
        const result = await Alumno.aggregate(pipeline);
        const labels = result.map(item => item.carrera || 'Sin especificar');
        const values = result.map(item => parseFloat(item.porcentaje.toFixed(2)));
        res.json({ labels, values });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular la morosidad por carrera' });
    }
});

// ========== DOCENTES ==========
router.get('/docentes', async (req, res) => {
    const docentes = await Docente.find();
    res.json(docentes);
});
router.post('/docentes/asignar', async (req, res) => {
    try {
        const { docenteIdentificador, materia, grupoId } = req.body;
        const docente = await Docente.findOne({ $or: [{ matricula: docenteIdentificador }, { nombre: docenteIdentificador }] });
        if (!docente) return res.status(404).json({ error: 'Docente no encontrado' });
        const grupo = await Grupo.findById(grupoId);
        if (!grupo) return res.status(404).json({ error: 'Grupo no encontrado' });
        const asignacion = new Asignacion({ docenteId: docente._id, docenteMatricula: docente.matricula, docenteNombre: docente.nombre, materia, grupoId: grupo._id, grupoNombre: grupo.nombre, grupo: grupo.nombre, fecha: new Date() });
        await asignacion.save();
        res.json({ mensaje: 'Asignación guardada' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
router.post('/docentes/subir-lista', async (req, res) => { res.json({ mensaje: 'Lista subida' }); });
router.post('/docentes/asistencia', async (req, res) => {
    try {
        const { docenteMatricula, tipo } = req.body;
        const docente = await Docente.findOne({ matricula: docenteMatricula });
        if (!docente) return res.status(404).json({ error: 'Docente no encontrado' });
        const asistencia = new AsistenciaDocente({ docenteId: docente._id, docenteMatricula, tipo, fecha: new Date() });
        await asistencia.save();
        res.json({ mensaje: `${tipo} registrada`, hora: new Date().toLocaleTimeString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/docentes/asistencias/:docenteMatricula', async (req, res) => {
    try {
        const asistencias = await AsistenciaDocente.find({ docenteMatricula: req.params.docenteMatricula }).sort({ fecha: -1 });
        res.json(asistencias);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/docentes/horarios', async (req, res) => {
    try {
        const { docenteMatricula, materia, grupoId, horarios } = req.body;
        const docente = await Docente.findOne({ matricula: docenteMatricula });
        if (!docente) return res.status(404).json({ error: 'Docente no encontrado' });
        const HorarioDocente = require('../models/HorarioDocente');
        for (const h of horarios) {
            const nuevo = new HorarioDocente({ docenteMatricula, dia: h.dia, hora: h.hora, materia, grupoId });
            await nuevo.save();
        }
        res.json({ mensaje: 'Horarios guardados' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/docentes/asignaciones', async (req, res) => {
    try {
        const asignaciones = await Asignacion.find().sort({ fecha: -1 });
        res.json(asignaciones);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== RUTAS DE CLASES ==========
router.get('/docente/clases', async (req, res) => {
    const { matricula } = req.query;
    if (!matricula) return res.status(400).json({ error: 'Matrícula requerida' });
    try {
        const clases = await Clase.find({ docenteMatricula: matricula });
        res.json(clases);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/docente/clases', async (req, res) => {
    try {
        const { docenteMatricula, materia, grupoId, nombre, descripcion, limiteEstudiantes } = req.body;
        const nuevaClase = new Clase({
            nombre,
            materia,
            grupoId,
            docenteMatricula,
            descripcion,
            limiteEstudiantes,
            estudiantesInscritos: []
        });
        await nuevaClase.save();
        res.status(201).json(nuevaClase);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/docente/clases/:id', async (req, res) => {
    try {
        const claseId = req.params.id;
        const clase = await Clase.findById(claseId);
        if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
        await Tarea.deleteMany({ claseId });
        await Comentario.deleteMany({ claseId });
        await Material.deleteMany({ claseId });
        const tareas = await Tarea.find({ claseId });
        const tareasIds = tareas.map(t => t._id);
        if (tareasIds.length) {
            await Entrega.deleteMany({ tareaId: { $in: tareasIds } });
        }
        await Clase.findByIdAndDelete(claseId);
        res.json({ mensaje: 'Clase eliminada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
router.post('/docente/clases/:id/agregar-alumno', async (req, res) => {
    try {
        const claseId = req.params.id;
        const { matricula } = req.body;
        if (!matricula) return res.status(400).json({ error: 'Matrícula requerida' });
        const alumno = await Alumno.findOne({ matricula });
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
        const clase = await Clase.findById(claseId);
        if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
        if (clase.estudiantesInscritos.includes(matricula)) {
            return res.status(400).json({ error: 'El alumno ya está inscrito' });
        }
        clase.estudiantesInscritos.push(matricula);
        await clase.save();
        res.json({ mensaje: 'Alumno agregado correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
router.get('/alumno/clases', async (req, res) => {
    const { matricula } = req.query;
    if (!matricula) return res.status(400).json({ error: 'Matrícula requerida' });
    try {
        const clases = await Clase.find({ estudiantesInscritos: matricula });
        const grupos = await Grupo.find();
        const grupoMap = Object.fromEntries(grupos.map(g => [g._id.toString(), g.nombre]));
        const resultado = clases.map(c => ({
            _id: c._id,
            nombre: c.nombre,
            materia: c.materia,
            grupoNombre: grupoMap[c.grupoId?.toString()] || 'Sin grupo',
            docenteMatricula: c.docenteMatricula,
            descripcion: c.descripcion
        }));
        res.json(resultado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
router.get('/docente/clases/:id', async (req, res) => {
    try {
        const clase = await Clase.findById(req.params.id);
        if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
        const materiales = await Material.find({ claseId: req.params.id });
        res.json({ ...clase.toObject(), materiales });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== HORARIO PERSONAL DEL ALUMNO ==========
router.get('/alumnos/:matricula/horario-personal', async (req, res) => {
    try {
        const { matricula } = req.params;
        const horarios = await HorarioAlumno.find({ alumnoMatricula: matricula });
        res.json(horarios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/alumnos/:matricula/horario-personal', async (req, res) => {
    try {
        const { matricula } = req.params;
        const { horarios } = req.body;
        if (!Array.isArray(horarios)) {
            return res.status(400).json({ error: 'Se requiere un array de horarios' });
        }
        // Validar campos
        for (const h of horarios) {
            if (!h.dia || !h.hora || !h.materia) {
                return res.status(400).json({ error: 'Cada horario debe tener día, hora y materia' });
            }
        }
        await HorarioAlumno.deleteMany({ alumnoMatricula: matricula });
        const nuevos = horarios.map(h => ({ ...h, alumnoMatricula: matricula }));
        let inserted = [];
        if (nuevos.length > 0) {
            inserted = await HorarioAlumno.insertMany(nuevos);
        }
        res.json({ mensaje: 'Horario guardado correctamente', horarios: inserted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/alumnos/:matricula/horario-personal/:id', async (req, res) => {
    try {
        await HorarioAlumno.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Entrada eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== BOLETAS ==========
const storageBoleta = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/boletas/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const uploadBoleta = multer({ storage: storageBoleta });

router.post('/boletas/subir', uploadBoleta.single('archivo'), async (req, res) => {
    try {
        const { alumnoMatricula, periodo } = req.body;
        if (!alumnoMatricula || !periodo || !req.file) {
            return res.status(400).json({ error: 'Faltan datos o archivo' });
        }
        const nuevaBoleta = new Boleta({
            alumnoMatricula,
            periodo,
            urlArchivo: `/uploads/boletas/${req.file.filename}`
        });
        await nuevaBoleta.save();
        res.json({ mensaje: 'Boleta subida correctamente', boleta: nuevaBoleta });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/boletas/alumno/:matricula', async (req, res) => {
    try {
        const boletas = await Boleta.find({ alumnoMatricula: req.params.matricula }).sort({ fechaSubida: -1 });
        res.json(boletas);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.delete('/boletas/:id', async (req, res) => {
    try {
        await Boleta.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Boleta eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== CAMBIAR CONTRASEÑA ==========
router.put('/alumno/password', async (req, res) => {
    try {
        const { matricula, oldPassword, newPassword } = req.body;
        if (!matricula || !oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Faltan datos obligatorios' });
        }
        const alumno = await Alumno.findOne({ matricula });
        if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado' });
        const isMatch = await alumno.comparePassword(oldPassword);
        if (!isMatch) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{1,8}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener máximo 8 caracteres, incluir un número y un símbolo' });
        }
        const bcrypt = require('bcryptjs');
        const hashed = await bcrypt.hash(newPassword, 10);
        alumno.password = hashed;
        await alumno.save();
        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error('Error al cambiar contraseña:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
