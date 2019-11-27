/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const config = require('config');
const _ = require('lodash');
const bcrypt = require('bcrypt');
const debug = require('debug')('app:startup');
const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { User } = require('../models/user');

const dev = express().get('env') === 'development';

mongoose.connect(process.env.MONGO_DB_PATH)
  .then(() => dev && debug(`SUCCESS | Connected to mongodb at: ${process.env.MONGO_DB_PATH}`))
  .catch(err => dev && debug(`ERROR | Could not connect to mongodb: ${err}`));

function validateRegister(user) {
  const schema = {
    businessName: Joi.string()
      .min(5)
      .max(50)
      .required(),
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

function validateUpdate(user) {
  const schema = {
    businessName: Joi.string()
      .min(5)
      .max(50)
      .required(),
    name: Joi.string()
      .min(5)
      .max(50)
      .required(),
  };

  return Joi.validate(user, schema);
}

const validateRegisterBody = (req) => {
  const { error } = validateRegister(req.body);
  if (error) throw Error(error.details[0].message);
};

const validateUpdateBody = (req) => {
  const { error } = validateUpdate(req.body);
  if (error) throw Error(error.details[0].message);
};

const hasExistingAccount = async (req) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) throw Error('User is already registered.');
};

const createAccount = async (req) => {
  const user = new User(_.pick(req.body, ['businessName', 'name', 'email', 'password']));
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();
  } catch (error) {
    if (error) throw Error('User could not be created');
  }
};

exports.get = async (req, res) => {
  const tokenHeader = req.headers['x-auth-token'];
  const token = jwt.verify(tokenHeader, config.get('jwtPrivateKey'));
  const user = await User.findById(token._id).select('businessName name');
  res.send(user);
};

exports.create = async (req, res) => {
  try {
    validateRegisterBody(req, res);
    await hasExistingAccount(req);
    await createAccount(req, res);
  } catch (error) {
    if (error && dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(400).send(error.message);
  }
  const user = new User(_.pick(req.body, ['name', 'email', 'password']));
  return res.send(user);
};

exports.update = async (req, res) => {
  const tokenHeader = req.headers['x-auth-token'];
  const token = jwt.verify(tokenHeader, config.get('jwtPrivateKey'));

  let user;
  try {
    validateUpdateBody(req, res);
    user = await User.findByIdAndUpdate(token._id, {
      $set: req.body,
    });
  } catch (error) {
    throw Error('User could not be updated');
  }
  return res.send(user);
};
