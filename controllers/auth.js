const bcrypt = require('bcrypt');
const config = require('config');
const debug = require('debug')('app:startup');
const express = require('express');
const mongoose = require('mongoose');
const Joi = require('joi');
const { User } = require('../models/user');

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

const validateRequestBody = (req) => {
  const { error } = validate(req.body);
  if (error) throw Error(error.details[0].message);
};

const validateUser = async (req) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) throw Error('Invalid email or password.');
};

const validatePassword = async (req) => {
  const user = await User.findOne({ email: req.body.email });
  const isValidPassword = await bcrypt.compare(req.body.password, user.password);
  if (!isValidPassword) throw Error('Invalid email or password.');
};

const getToken = async (req) => {
  const user = await User.findOne({ email: req.body.email });
  return user.generateAuthToken(user);
};

module.exports = async (req, res) => {
  try {
    validateRequestBody(req, res);
    await validateUser(req, res);
    await validatePassword(req, res);
  } catch (error) {
    if (error && dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(400).send(error.message);
  }

  const token = await getToken(req, res);
  return res.send(token);
};
