const express = require('express');
const auth = require('../middleware/auth');
const { create, get } = require('../models/user');

const router = express.Router();

router.get('/me', auth, (req, res) => get(req, res));
router.post('/', (req, res) => create(req, res));

module.exports = router;
