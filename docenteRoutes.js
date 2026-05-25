const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Modelos existentes
const Docente = require('../models/Docente');
const Asignacion = require('../models/Asignacion');
const HorarioDocente = require('../models/HorarioDocente');
const Alumno = require('../models/Alumno');
const AsistenciaDocente = require('../models/AsistenciaDocente');
const Calificacion = require('../models/Calificacion');
const CriterioEvaluacion = require('../models/CriteriosEvaluacion');
const Boleta = require('../models/Boleta');
const Grupo = require('../models/Grupo');

// Nuevos modelos para planificación académica
const Clase = require('../models/Clase');
const Material = require('../models/Material');
const Tarea = require('../models/Tarea');
const Examen = require('../models/Examen');

// Modelos para interacción (docente-alumno)
const Entrega = require('../models/Entrega');
const Comentario = require('../models/Comentario');
const EntregaEst = require('../models/EntregaEstudiante'); // Sincronización con base estudiante

// ========== PERFIL Y CONFIGURACIÓN ==========
router.get('/docente/perfil', async (req, res) => {
    const matricula = req.query.matricula;
    const docente = await Docente.findOne({ matricula }).select('-password');
    if (!docente) return res.status(404).json({ error: 'Docente no encontrado' });
    res.json(docente);
});

// Configurar almacenamiento de imágenes para perfil
const storagePerfil = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/docentes/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadPerfil = multer({ storage: storagePerfil });

router.put('/docente/perfil', uploadPerfil.single('foto'), async (req, res) => {
    const { matricula, nombre, telefono, email } = req.body;
    let fotoUrl = null;
    if (req.file) fotoUrl = `/uploads/docentes/${req.file.filename}`;
    const updateData = { nombre, telefono, email };
    if (fotoUrl) updateData.foto = fotoUrl;
    const docente = await Docente.findOneAndUpdate({ matricula }, updateData, { new: true }).select('-password');
    res.json(docente);
});

router.put('/docente/password', async (req, res) => {
    const { matricula, oldPassword, newPassword } = req.body;
    const docente = await Docente.findOne({ matricula });
    if (!docente) return res.status(404).json({ error: 'Docente no encontrado' });
    const match = await bcrypt.compare(oldPassword, docente.password);
    if (!match) return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    docente.password = await bcrypt.hash(newPassword, 10);
    await docente.save();
    res.json({ mensaje: 'Contraseña actualizada' });
});

// ========== MATERIAS Y GRUPOS ASIGNADOS ==========
router.get('/docente/asignaciones', async (req, res) => {
    const { matricula } = req.query;
    const asignaciones = await Asignacion.find({ docenteMatricula: matricula });
    const result = [];
    for (let asig of asignaciones) {
        const grupo = await Grupo.findById(asig.grupoId);
        result.push({
            _id: asig._id,
            docenteMatricula: asig.docenteMatricula,
            materia: asig.materia,
            grupoId: asig.grupoId,
            grupoNombre: grupo ? grupo.nombre : null,
            fecha: asig.fecha
        });
    }
    res.json(result);
});

router.get('/docente/materias-grupos', async (req, res) => {
    const { matricula } = req.query;
    const asignaciones = await Asignacion.find({ docenteMatricula: matricula });
    const materias = [...new Set(asignaciones.map(a => a.materia))];
    const gruposIds = [...new Set(asignaciones.map(a => a.grupoId))];
    const grupos = await Grupo.find({ _id: { $in: gruposIds } });
    res.json({ materias, grupos: grupos.map(g => ({ _id: g._id, nombre: g.nombre })) });
});

// ========== HORARIO SEMANAL ==========
router.get('/docente/horario', async (req, res) => {
    const { matricula } = req.query;
    const horarios = await HorarioDocente.find({ docenteMatricula: matricula }).sort('dia hora');
    res.json(horarios);
});

router.post('/docente/horario', async (req, res) => {
    const { _id, docenteMatricula, dia, hora, materia, grupoId } = req.body;
    try {
        if (_id) {
            const updated = await HorarioDocente.findByIdAndUpdate(_id, { dia, hora, materia, grupoId }, { new: true });
            res.json(updated);
        } else {
            const nuevo = new HorarioDocente({ docenteMatricula, dia, hora, materia, grupoId });
            await nuevo.save();
            res.status(201).json(nuevo);
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/docente/horario/:id', async (req, res) => {
    try {
        await HorarioDocente.findByIdAndDelete(req.params.id);
        res.json({ mensaje: 'Horario eliminado' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== ESTUDIANTES POR GRUPO ==========
router.get('/grupo/:grupoId/estudiantes', async (req, res) => {
    const { grupoId } = req.params;
    const estudiantes = await Alumno.find({ grupoActual: grupoId }).select('nombre matricula email');
    res.json(estudiantes);
});

// ========== ASISTENCIA DOCENTE ==========
router.post('/docente/asistencia', async (req, res) => {
    const { docenteMatricula, tipo } = req.body;
    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);
    let registro = await AsistenciaDocente.findOne({ docenteMatricula, fecha: { $gte: inicioDia } });
    if (!registro) registro = new AsistenciaDocente({ docenteMatricula });
    if (tipo === 'entrada') registro.entrada = new Date();
    else if (tipo === 'salida') registro.salida = new Date();
    await registro.save();
    res.json({ mensaje: `${tipo} registrada`, hora: new Date().toLocaleTimeString() });
});

router.get('/docente/asistencia/:docenteMatricula', async (req, res) => {
    const asistencias = await AsistenciaDocente.find({ docenteMatricula: req.params.docenteMatricula }).sort({ fecha: -1 });
    res.json(asistencias);
});

router.get('/reportes/asistencia-docentes', async (req, res) => {
    const { desde, hasta } = req.query;
    let filtro = {};
    if (desde) filtro.fecha = { $gte: new Date(desde) };
    if (hasta) filtro.fecha = { ...filtro.fecha, $lte: new Date(hasta) };
    const asistencias = await AsistenciaDocente.find(filtro);
    res.json(asistencias);
});

// ========== CALIFICACIONES ==========
router.get('/docente/calificaciones', async (req, res) => {
    const { docenteMatricula, materia, grupoId } = req.query;
    const calificaciones = await Calificacion.find({ docenteMatricula, materia, grupoId });
    res.json(calificaciones);
});

router.post('/docente/calificaciones', async (req, res) => {
    const { docenteMatricula, materia, grupoId, alumnoMatricula, tipo, calificacion, comentario } = req.body;
    const nueva = new Calificacion({ docenteMatricula, materia, grupoId, alumnoMatricula, tipo, calificacion, comentario });
    await nueva.save();
    res.status(201).json(nueva);
});

router.put('/docente/calificaciones/:id', async (req, res) => {
    const { calificacion, comentario } = req.body;
    await Calificacion.findByIdAndUpdate(req.params.id, { calificacion, comentario });
    res.json({ mensaje: 'Actualizada' });
});

router.get('/docente/criterios', async (req, res) => {
    const { docenteMatricula, materia, grupoId } = req.query;
    let criterio = await CriterioEvaluacion.findOne({ docenteMatricula, materia, grupoId });
    if (!criterio) criterio = { criterios: [] };
    res.json(criterio);
});

router.post('/docente/criterios', async (req, res) => {
    const { docenteMatricula, materia, grupoId, criterios } = req.body;
    let criterio = await CriterioEvaluacion.findOneAndUpdate(
        { docenteMatricula, materia, grupoId },
        { criterios },
        { upsert: true, new: true }
    );
    res.json(criterio);
});

router.get('/docente/boleta/:alumnoMatricula/:materia', async (req, res) => {
    const { alumnoMatricula, materia } = req.params;
    const califs = await Calificacion.find({ alumnoMatricula, materia });
    const calificacionesObj = {};
    let suma = 0, cont = 0;
    califs.forEach(c => {
        calificacionesObj[c.tipo] = c.calificacion;
        suma += c.calificacion;
        cont++;
    });
    const promedio = cont ? (suma / cont).toFixed(2) : 0;
    const boletaData = {
        alumnoMatricula,
        materia,
        calificaciones: calificacionesObj,
        promedio,
        periodo: '2025-1'
    };
    const boleta = await Boleta.findOneAndUpdate(
        { alumnoMatricula, materia },
        boletaData,
        { upsert: true, new: true }
    );
    res.json(boleta);
});

router.get('/docente/promedio/:alumnoMatricula/:materia/:grupoId', async (req, res) => {
    const { alumnoMatricula, materia, grupoId } = req.params;
    const criterio = await CriterioEvaluacion.findOne({ materia, grupoId });
    if (!criterio || !criterio.criterios.length) {
        return res.json({ promedio: 'Sin criterios', detalle: [] });
    }
    const califs = await Calificacion.find({ alumnoMatricula, materia, grupoId });
    const mapaNotas = {};
    califs.forEach(c => { mapaNotas[c.tipo] = c.calificacion; });
    let sumaPonderada = 0;
    let sumaPorcentajes = 0;
    const detalle = [];
    for (const crit of criterio.criterios) {
        const nota = mapaNotas[crit.nombre] || 0;
        const aporte = (nota * crit.porcentaje) / 100;
        sumaPonderada += aporte;
        sumaPorcentajes += crit.porcentaje;
        detalle.push({ tipo: crit.nombre, nota, porcentaje: crit.porcentaje, aporte });
    }
    const promedio = sumaPorcentajes > 0 ? (sumaPonderada * 100) / sumaPorcentajes : 0;
    res.json({ promedio: promedio.toFixed(2), detalle });
});

// ========== PLANIFICACIÓN Y CONTENIDO ACADÉMICO ==========
const storageMaterial = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/material/';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const uploadMaterial = multer({ storage: storageMaterial });

// Crear clase
router.post('/docente/clases', async (req, res) => {
    const { docenteMatricula, materia, grupoId, nombre, descripcion, limiteEstudiantes } = req.body;
    const nuevaClase = new Clase({ docenteMatricula, materia, grupoId, nombre, descripcion, limiteEstudiantes });
    await nuevaClase.save();
    res.status(201).json(nuevaClase);
});

// Obtener clases del docente
router.get('/docente/clases', async (req, res) => {
    const { matricula } = req.query;
    const clases = await Clase.find({ docenteMatricula: matricula });
    res.json(clases);
});

// Obtener detalle de una clase (materiales, tareas, exámenes)
router.get('/docente/clases/:id', async (req, res) => {
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
    const materiales = await Material.find({ claseId: clase._id });
    const tareas = await Tarea.find({ claseId: clase._id });
    const examenes = await Examen.find({ claseId: clase._id });
    res.json({ clase, materiales, tareas, examenes });
});

// Añadir estudiante a una clase por correo
router.post('/docente/clases/:id/agregar-estudiante', async (req, res) => {
    const { email } = req.body;
    const clase = await Clase.findById(req.params.id);
    if (!clase) return res.status(404).json({ error: 'Clase no encontrada' });
    const alumno = await Alumno.findOne({ email });
    if (!alumno) return res.status(404).json({ error: 'No existe un estudiante con ese correo' });
    if (clase.estudiantesInscritos.includes(alumno.matricula)) {
        return res.status(400).json({ error: 'El estudiante ya está en la clase' });
    }
    clase.estudiantesInscritos.push(alumno.matricula);
    await clase.save();
    res.json({ mensaje: 'Estudiante agregado' });
});

// ========== TAREAS (CRUD completo) ==========
router.get('/clases/:id/tareas', async (req, res) => {
    const tareas = await Tarea.find({ claseId: req.params.id }).sort({ fechaEntrega: 1 });
    res.json(tareas);
});

router.post('/tareas', async (req, res) => {
    const { claseId, titulo, objetivo, descripcion, fechaEntrega, calificacion } = req.body;
    const tarea = new Tarea({ claseId, titulo, objetivo, descripcion, fechaEntrega, calificacion });
    await tarea.save();
    res.status(201).json(tarea);
});

router.put('/tareas/:id', async (req, res) => {
    const tarea = await Tarea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(tarea);
});

router.delete('/tareas/:id', async (req, res) => {
    await Tarea.findByIdAndDelete(req.params.id);
    res.json({ mensaje: 'Eliminada' });
});

// ========== MATERIALES ==========
router.post('/docente/materiales', uploadMaterial.single('archivo'), async (req, res) => {
    const { claseId, titulo, tipo, enlace, descripcion } = req.body;
    let url = enlace || '';
    if (req.file) url = `/uploads/material/${req.file.filename}`;
    const material = new Material({ claseId, titulo, tipo, url, descripcion });
    await material.save();
    res.status(201).json(material);
});

// ========== EXÁMENES ==========
router.post('/docente/examenes', async (req, res) => {
    const { claseId, titulo, preguntas, fechaDisponible, fechaCierre, intentosPermitidos } = req.body;
    const examen = new Examen({ claseId, titulo, preguntas, fechaDisponible, fechaCierre, intentosPermitidos });
    await examen.save();
    res.status(201).json(examen);
});

// ========== COMENTARIOS ==========
router.get('/clases/:id/comentarios', async (req, res) => {
    const comentarios = await Comentario.find({ claseId: req.params.id }).sort({ fecha: 1 });
    res.json(comentarios);
});

router.post('/comentarios', async (req, res) => {
    const comentario = new Comentario(req.body);
    await comentario.save();
    res.status(201).json(comentario);
});

// ========== ENTREGAS (con sincronización a base estudiante) ==========
router.post('/entregas', uploadMaterial.single('archivo'), async (req, res) => {
    const { tareaId, alumnoMatricula, alumnoNombre, comentario, tareaTitulo } = req.body;
    let archivoUrl = null;
    if (req.file) archivoUrl = `/uploads/material/${req.file.filename}`;
    
    // Guardar en base docente
    const entrega = new Entrega({
        tareaId,
        alumnoMatricula,
        alumnoNombre,
        archivo: archivoUrl,
        comentario,
        fechaEntrega: new Date()
    });
    await entrega.save();
    await Tarea.findByIdAndUpdate(tareaId, { $push: { entregas: entrega._id } });
    
    // Sincronizar con base estudiante (opcional, pero recomendado)
    try {
        const entregaEst = new EntregaEst({
            _id: entrega._id,
            tareaId,
            tareaTitulo: tareaTitulo || '',
            alumnoMatricula,
            alumnoNombre,
            archivo: archivoUrl,
            comentario,
            fechaEntrega: entrega.fechaEntrega,
            estado: 'entregado'
        });
        await entregaEst.save();
    } catch (err) {
        console.error('Error guardando en base estudiante:', err);
        // No detenemos la respuesta, solo registramos
    }
    
    res.status(201).json(entrega);
});

router.get('/tareas/:id/entregas', async (req, res) => {
    const entregas = await Entrega.find({ tareaId: req.params.id });
    res.json(entregas);
});

router.put('/entregas/:id', async (req, res) => {
    const { calificacion, retroalimentacion } = req.body;
    const entrega = await Entrega.findByIdAndUpdate(req.params.id, { calificacion, retroalimentacion, estado: 'calificado' }, { new: true });
    // Sincronizar con base estudiante
    try {
        await EntregaEst.findOneAndUpdate(
            { _id: req.params.id },
            { calificacion, retroalimentacion, estado: 'calificado' },
            { upsert: true }
        );
    } catch (err) {
        console.error('Error sincronizando calificación:', err);
    }
    res.json(entrega);
});

// ========== CLASES DEL ALUMNO (para estudiante) ==========
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
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;