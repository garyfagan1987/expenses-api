const express = require('express');
const auth = require('../middleware/auth');

const router = express.Router();
const {
  create,
  get,
  one,
  update,
  remove,
} = require('../models/sheet');

router.post('/', auth, (req, res) => create(req, res));
router.get('/', auth, (req, res) => get(req, res));
router.get('/:id', auth, (req, res) => one(req, res));
router.put('/:id', auth, (req, res) => update(req, res));
router.delete('/:id', auth, (req, res) => remove(req, res));

module.exports = router;
