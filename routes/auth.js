const express = require('express');
const auth = require('../models/auth');

const router = express.Router();

router.post('/', (req, res) => auth(req, res));

module.exports = router;
