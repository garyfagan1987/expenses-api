/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const _ = require('lodash');
const bcrypt = require('bcrypt');
const config = require('config');
const debug = require('debug')('app:startup');
const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const dev = express().get('env') === 'development';

const userSchema = new mongoose.Schema({
  email: {
    maxlength: 255,
    minlength: 5,
    required: true,
    type: String,
    unique: true,
  },
  name: {
    maxlength: 50,
    minlength: 5,
    required: true,
    type: String,
  },
  password: {
    maxlength: 1024,
    minlength: 5,
    required: true,
    type: String,
  },
});

userSchema.methods.generateAuthToken = () => jwt.sign({ _id: this.id }, config.get('jwtPrivateKey'));

const User = mongoose.model('User', userSchema);

mongoose.connect(config.get('mongodbPath'))
  .then(() => dev && debug(`SUCCESS | Connected to mongodb at: ${config.get('mongodbPath')}`))
  .catch(err => dev && debug(`ERROR | Could not connect to mongodb: ${err}`));

function validate(user) {
  const schema = {
    email: Joi.string()
      .min(5)
      .max(255)
      .required()
      .email(),
    name: Joi.string()
      .min(5)
      .max(50)
      .required(),
    password: Joi.string()
      .min(5)
      .max(1024)
      .required(),
  };

  return Joi.validate(user, schema);
}

exports.get = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.send(user);
};

exports.create = async (req, res) => {
  const { error } = validate(req.body);
  if (error && dev) debug(`ERROR | ${req.method} | ${req.url}`);
  if (error) return res.status(400).send(error.details[0].message);
  const hasAccount = await User.findOne({ email: req.body.email });
  if (hasAccount) return res.status(400).send('User is already registered.');
  const user = new User(_.pick(req.body, ['name', 'email', 'password']));
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
    if (dev) debug(`SUCCESS | ${req.method} | ${req.url}`);
    const token = user.generateAuthToken();
    return res.header('x-auth-token', token).send(_.pick(user, ['id', 'name', 'email']));
  } catch (ex) {
    if (dev) debug(`ERROR | ${ex.message}`);
    return res.status(404).send('user could not be created');
  }
};

exports.User = User;
