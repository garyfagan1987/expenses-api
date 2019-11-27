const express = require('express');
const auth = require('../middleware/auth');
const { create, get, update } = require('../controllers/user');

const router = express.Router();

router.get('/me', auth, (req, res) => get(req, res));
router.post('/', (req, res) => create(req, res));
router.put('/', auth, (req, res) => update(req, res));

module.exports = router;
