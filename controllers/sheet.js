/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const config = require('config');
const debug = require('debug')('app:startup');
const express = require('express');
const Joi = require('joi');
const mongoose = require('mongoose');

const { Sheet } = require('../models/sheet');

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

const validateRequestBody = (req) => {
  const { error } = validate(req.body);
  if (error) throw Error(error.details[0].message);
};

const createSheet = async (req) => {
  let result;
  const sheet = new Sheet({
    date: req.body.date,
    isPublished: req.body.isPublished,
    title: req.body.title,
  });
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
      $set: {
        date: req.body.date,
        isPublished: req.body.isPublished,
        title: req.body.title,
      },
    });
  } catch (error) {
    throw Error('Sheet could not be updated');
  }
  return result;
};

exports.create = async (req, res) => {
  let sheet;
  try {
    validateRequestBody(req, res);
    sheet = await createSheet(req);
  } catch (error) {
    if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(400).send(error.message);
  }
  return res.send(sheet);
};

exports.get = async (req, res) => {
  const sheets = await Sheet.find().sort({ date: 1 });
  res.send(sheets);
};

exports.one = async (req, res) => {
  const result = await Sheet.findById(req.params.id).catch(() => {
    if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(404).send('Sheet was not found');
  });
  return res.send(result);
};

exports.update = async (req, res) => {
  let sheet;
  try {
    validateRequestBody(req, res);
    sheet = await updateSheet(req);
  } catch (error) {
    if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(400).send(error.message);
  }
  return res.send(sheet);
};

exports.remove = async (req, res) => {
  const result = await Sheet.findByIdAndRemove(req.params.id).catch(() => {
    if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
    res.status(404).send('Sheet was not found');
  });
  if (result) res.send(result);
};
