/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const mongoose = require('mongoose');

const sheetSchema = new mongoose.Schema({
  date: { default: Date.now, type: Date },
  isPublished: { required: true, type: Boolean },
  items: { required: true, type: Array },
  title: { required: true, type: String },
  totalGross: { required: true, type: Number },
  totalNet: { required: true, type: Number },
  totalVat: { required: true, type: Number },
});

const Sheet = mongoose.model('Sheet', sheetSchema);

exports.Sheet = Sheet;
