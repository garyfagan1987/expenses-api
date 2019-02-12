/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const config = require('config');
const debug = require('debug')('app:startup');
const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');

const dev = express().get('env') === 'development';

mongoose.connect(config.get('mongodbPath'))
  .then(() => dev && debug(`SUCCESS | Connected to mongodb at: ${config.get('mongodbPath')}`))
  .catch(err => dev && debug(`ERROR | Could not connect to mongodb: ${err}`));

function validate(sheet) {
  return Joi.validate(sheet, {
    date: Joi.date().required(),
    isPublished: Joi.boolean().required(),
    title: Joi.string().min(3).required(),
  });
}

const sheetSchema = new mongoose.Schema({
  date: { default: Date.now, type: Date },
  isPublished: { required: true, type: Boolean },
  title: { required: true, type: String },
});

const Sheet = mongoose.model('Sheet', sheetSchema);

exports.create = async (req, res) => {
  const { error } = validate(req.body);
  if (error && dev) debug(`ERROR | ${req.method} | ${req.url}`);
  if (error) return res.status(404).send(error.details[0].message);
  const sheet = new Sheet({
    date: req.body.date,
    isPublished: req.body.isPublished,
    title: req.body.title,
  });
  try {
    const result = await sheet.save();
    if (dev) debug(`SUCCESS | ${req.method} | ${req.url}`);
    return res.send(result);
  } catch (ex) {
    if (dev) debug(`ERROR | ${ex.message}`);
    return res.status(404).send('this sheet could not be saved');
  }
};

exports.get = async (req, res) => {
  const sheets = await Sheet.find().sort({ date: 1 }).select({ date: 1, title: 1 });
  if (dev) debug(`SUCCESS | ${req.method} | ${req.url}`);

  const transformedSheets = sheets.map(sheet => ({
    date: sheet.date,
    id: sheet._id,
    title: sheet.title,
  }));

  res.send(transformedSheets);
};

exports.one = async (req, res) => {
  const result = await Sheet.findById(req.params.id).catch(() => {
    if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(404).send('this sheet was not found');
  });
  if (result && dev) debug(`SUCCESS | ${req.method} | ${req.url}`);
  return res.send(result);
};

exports.update = async (req, res) => {
  const { error } = validate(req.body);
  if (error && dev) debug(`ERROR | ${req.method} | ${req.url}`);
  if (error) return res.status(404).send(error.details[0].message);
  const result = await Sheet.findByIdAndUpdate(req.params.id, {
    $set: {
      date: req.body.date,
      isPublished: req.body.isPublished,
      title: req.body.title,
    },
  }, { new: true }).catch(() => {
    if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(404).send('this sheet was not found');
  });
  if (result && dev) debug(`SUCCESS | ${req.method} | ${req.url}`);
  return res.send(result);
};

exports.remove = async (req, res) => {
  const result = await Sheet.findByIdAndRemove(req.params.id).catch(() => {
    if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
    res.status(404).send('this sheet was not found');
  });
  if (result && dev) debug(`SUCCESS | ${req.method} | ${req.url}`);
  if (result) res.send(result);
};
