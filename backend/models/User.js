const e = require('express');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 100
  },
  dob: {
    type: Date,
    required: true
  },
  workingStatus: {
    type: String,
    required: true,
    enum: ['Student', 'Housewife', 'Working Professional', 'employed', 'unemployed', 'student', 'retired', 'other']

  }
});

module.exports = mongoose.model('User', UserSchema);
