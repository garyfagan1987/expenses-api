/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const mongoose = require('mongoose');

const sheetSchema = new mongoose.Schema({
  date: { default: Date.now, type: Date },
  isPublished: { required: true, type: Boolean },
  items: { required: true, type: Array },
  title: { required: true, type: String },
  totalGross: { required: true, type: String },
  totalVat: { required: true, type: String },
});

const Report = mongoose.model('Report', sheetSchema);

exports.Report = Report;
