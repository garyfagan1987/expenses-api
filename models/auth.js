const bcrypt = require('bcrypt');
const config = require('config');
const debug = require('debug')('app:startup');
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const { User } = require('./user');

const dev = express().get('env') === 'development';

mongoose.connect(config.get('mongodbPath'))
  .then(() => dev && debug(`SUCCESS | Connected to mongodb at: ${config.get('mongodbPath')}`))
  .catch(err => dev && debug(`ERROR | Could not connect to mongodb: ${err}`));

function validate(req) {
  const schema = {
    email: Joi.string()
      .min(5)
      .max(255)
      .required()
      .email(),
    password: Joi.string()
      .min(5)
      .max(1024)
      .required(),
  };

  return Joi.validate(req, schema);
}

module.exports = async (req, res) => {
  const { error } = validate(req.body);
  if (error && dev) debug(`ERROR | ${req.method} | ${req.url}`);
  if (error) return res.status(400).send(error.details[0].message);
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send('Invalid email or password.');
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send('Invalid email or password.');
  const token = user.generateAuthToken();
  return res.send(token);
};
