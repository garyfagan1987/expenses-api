/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const mongoose = require('mongoose');

const sheetSchema = new mongoose.Schema({
  date: { default: Date.now, type: Date },
  isPublished: { required: true, type: Boolean },
  items: { required: true, type: Array },
  title: { required: true, type: String },
  total_gross: { required: true, type: Number },
  total_net: { required: true, type: Number },
  total_vat: { required: true, type: Number },
});

const Sheet = mongoose.model('Sheet', sheetSchema);

exports.Sheet = Sheet;
