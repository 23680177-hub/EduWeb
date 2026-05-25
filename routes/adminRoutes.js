const express = require('express');
const router = express.Router();

router.get('/', (req, res) => { res.send('Admin routes funcionando'); });

module.exports = router;
