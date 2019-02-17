/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    maxlength: 255,
    minlength: 5,
    required: true,
    type: String,
    unique: true,
  },
  name: {
    maxlength: 50,
    minlength: 5,
    required: true,
    type: String,
  },
  password: {
    maxlength: 1024,
    minlength: 5,
    required: true,
    type: String,
  },
});

userSchema.methods.generateAuthToken = () => jwt.sign({ _id: this.id }, config.get('jwtPrivateKey'));

const User = mongoose.model('User', userSchema);

exports.User = User;
