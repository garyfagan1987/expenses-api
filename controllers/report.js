/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const config = require('config');
const debug = require('debug')('app:startup');
const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { Report } = require('../models/report');
const { User } = require('../models/user');

const dev = express().get('env') === 'development';

mongoose.connect(process.env.MONGO_DB_PATH)
  .then(() => dev && debug(`SUCCESS | Connected to mongodb at: ${process.env.MONGO_DB_PATH}`))
  .catch(err => dev && debug(`ERROR | Could not connect to mongodb: ${err}`));

const reducer = (accumulator, currentValue) => accumulator + currentValue;

function validate(report) {
  return Joi.validate(report, {
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
  const report = new Report(sheetData);
  try {
    result = await report.save();
  } catch (error) {
    throw Error('Report could not be created');
  }
  return result;
};

const updateSheet = async (req) => {
  let result;
  try {
    result = await Report.findByIdAndUpdate(req.params.id, {
      $set: transformSheet(req.body),
    });
  } catch (error) {
    throw Error('Report could not be updated');
  }
  return result;
};

exports.create = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));

  let report;
  try {
    validateRequestBody(req, res);
    report = await createSheet(req);
    await User.update({ _id: user._id }, { $push: { reports: { _id: report._id} } });
  } catch (error) {
    if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
    return res.status(400).send(error.message);
  }
  return res.send(report);
};

exports.get = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));
  const usersSheets = await User.findById(user._id).distinct('reports');
  const reports = await Report.find({ _id: { $in: usersSheets } });
  res.send(reports);
};

exports.one = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));
  const usersSheets = await User.findById(user._id).distinct('reports');
  const convertedUsersSheets = JSON.stringify(usersSheets);
  const isAllowed = convertedUsersSheets.includes(req.params.id);
  let result;
  if (isAllowed) {
    result = await Report.findById(req.params.id).catch(() => {
      if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
      return res.status(404).send('Report was not found');
    });
  } else {
    result = res.status(404).send('Report was not found');
  }

  return res.send(result);
};

exports.update = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));
  const usersSheets = await User.findById(user._id).distinct('reports');
  const convertedUsersSheets = JSON.stringify(usersSheets);
  const isAllowed = convertedUsersSheets.includes(req.params.id);
  let report;
  if (isAllowed) {
    try {
      validateRequestBody(req, res);
      report = await updateSheet(req);
    } catch (error) {
      if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
      return res.status(400).send(error.message);
    }
  } else {
    return res.status(400).send('Unable to update report');
  }
  return res.send(report);
};

exports.remove = async (req, res) => {
  const token = req.headers['x-auth-token'];
  const user = jwt.verify(token, config.get('jwtPrivateKey'));
  const usersSheets = await User.findById(user._id).distinct('reports');
  const convertedUsersSheets = JSON.stringify(usersSheets);
  const isAllowed = convertedUsersSheets.includes(req.params.id);

  if (isAllowed) {
    const result = await Report.findByIdAndRemove(req.params.id).catch(() => {
      if (dev) debug(`ERROR | ${req.method} | ${req.url}`);
      res.status(404).send('Report was not found');
    });
    await User.update({ _id: user._id }, { $pull: { reports: req.params.id } });
    if (result) res.send(result);
  } else {
    res.status(404).send('Report was not found');
  }
};
