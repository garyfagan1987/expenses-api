/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const config = require('config');
const debug = require('debug')('app:startup');
const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { Sheet } = require('../models/sheet');
const { User } = require('../models/user');

const dev = express().get('env') === 'development';

mongoose.connect(config.get('mongodbPath'))
  .then(() => dev && debug(`SUCCESS | Connected to mongodb at: ${config.get('mongodbPath')}`))
  .catch(err => dev && debug(`ERROR | Could not connect to mongodb: ${err}`));

const reducer = (accumulator, currentValue) => accumulator + currentValue;

function validate(sheet) {
  return Joi.validate(sheet, {
    date: Joi.date().required(),
    isPublished: Joi.boolean().required(),
    items: Joi.array().required(),
    title: Joi.string().min(3).required(),
  });
}

const validateRequestBody = (req) => {
  const { error } = validate(req.body);
  if (error) throw Error(error.details[0].message);
};


const transformSheet = data => ({
  date: data.date,
  isPublished: data.isPublished,
  items: data.items,
  title: data.title,
  totalGross: data.items.length > 0 ? data.items.map(item => parseFloat(item.price_gross)).reduce(reducer) : 0,
  totalNet: data.items.length > 0 ? data.items.map(item => parseFloat(item.price_net)).reduce(reducer) : 0,
  totalVat: data.items.length > 0 ? data.items.map(item => parseFloat(item.price_vat)).reduce(reducer) : 0,
});

const createSheet = async (req) => {
  let result;
  const sheetData = transformSheet(req.body);
  const sheet = new Sheet(sheetData);
  try {
    result = await sheet.save();
  } catch (error) {
    throw Error('Sheet could not be created');
  }
  return result;
};

const updateSheet = async (req) => {
  let result;
  try {
    result = await Sheet.findByIdAndUpdate(req.params.id, {
      $set: transformSheet(req.body),
    });
  } catch (error) {
    throw Error('Sheet could not be updated');
  }
  return result;
};

exports.create = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));

  let sheet;
  try {
    validateRequestBody(req, res);
    sheet = await createSheet(req);
    await User.update({ _id: user._id }, { $push: { sheets: { _id: sheet._id} } });
  } catch (error) {
    if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(400).send(error.message);
  }
  return res.send(sheet);
};

exports.get = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));
  const usersSheets = await User.findById(user._id).distinct('sheets');
  const sheets = await Sheet.find({ _id: { $in: usersSheets } });
  res.send(sheets);
};

exports.one = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));
  const usersSheets = await User.findById(user._id).distinct('sheets');
  const convertedUsersSheets = JSON.stringify(usersSheets);
  const isAllowed = convertedUsersSheets.includes(req.params.id);
  let result;
  if (isAllowed) {
    result = await Sheet.findById(req.params.id).catch(() => {
      if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
      return res.status(404).send('Sheet was not found');
    });
  } else {
    result = res.status(404).send('Sheet was not found');
  }

  return res.send(result);
};

exports.update = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));
  const usersSheets = await User.findById(user._id).distinct('sheets');
  const convertedUsersSheets = JSON.stringify(usersSheets);
  const isAllowed = convertedUsersSheets.includes(req.params.id);
  let sheet;
  if (isAllowed) {
    try {
      validateRequestBody(req, res);
      sheet = await updateSheet(req);
    } catch (error) {
      if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
      return res.status(400).send(error.message);
    }
  } else {
    return res.status(400).send('Unable to update sheet');
  }
  return res.send(sheet);
};

exports.remove = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));
  const usersSheets = await User.findById(user._id).distinct('sheets');
  const convertedUsersSheets = JSON.stringify(usersSheets);
  const isAllowed = convertedUsersSheets.includes(req.params.id);

  if (isAllowed) {
    const result = await Sheet.findByIdAndRemove(req.params.id).catch(() => {
      if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
      res.status(404).send('Sheet was not found');
    });
    await User.update({ _id: user._id }, { $pull: { sheets: req.params.id } });
    if (result) res.send(result);
  } else {
    res.status(404).send('Sheet was not found');
  }
};
