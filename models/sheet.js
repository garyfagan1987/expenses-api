/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const mongoose = require('mongoose');

const sheetSchema = new mongoose.Schema({
  date: { default: Date.now, type: Date },
  isPublished: { required: true, type: Boolean },
  title: { required: true, type: String },
});

const Sheet = mongoose.model('Sheet', sheetSchema);

exports.Sheet = Sheet;
