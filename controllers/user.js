/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const _ = require('lodash');
const bcrypt = require('bcrypt');
const debug = require('debug')('app:startup');
const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');

const { User } = require('../models/user');

const dev = express().get('env') === 'development';

mongoose.connect(process.env.MONGO_DB_PATH)
  .then(() => dev && debug(`SUCCESS | Connected to mongodb at: ${process.env.MONGO_DB_PATH}`))
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

const validateRequestBody = (req) => {
  console.log('2');
  const { error } = validate(req.body);
  if (error) throw Error(error.details[0].message);
};

const hasExistingAccount = async (req) => {
  console.log('3');
  const user = await User.findOne({ email: req.body.email });
  if (user) throw Error('User is already registered.');
};

const createAccount = async (req) => {
  console.log('4');
  const user = new User(_.pick(req.body, ['name', 'email', 'password']));
  try {
    console.log('5');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
  } catch (error) {
    console.log('6');
    if (error) throw Error('User could not be created');
  }
};

exports.get = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.send(user);
};

exports.create = async (req, res) => {
  try {
    console.log('1');
    validateRequestBody(req, res);
    await hasExistingAccount(req);
    await createAccount(req, res);
  } catch (error) {
    console.log('7');
    if (error && dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(400).send(error.message);
  }
  const user = new User(_.pick(req.body, ['name', 'email', 'password']));
  return res.send(user);
};
