/* eslint no-underscore-dangle: ["error", { "allow": ["_id"] }] */
const config = require('config');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  businessName: {
    maxlength: 50,
    minlength: 5,
    required: true,
    type: String,
  },
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
  reports: {
    required: true,
    type: [{
      ref: 'reports',
      type: mongoose.Schema.Types.ObjectId,
    }],
  },
});

userSchema.methods.generateAuthToken = (user) => {
  const { _id, name, email } = user;
  return jwt.sign({ _id, email, name }, config.get('jwtPrivateKey'));
};

const User = mongoose.model('User', userSchema);

exports.User = User;
