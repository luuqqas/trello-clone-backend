// models/Card.js
const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List'
  }
});

const Card = mongoose.model('Card', cardSchema);

module.exports = Card;
