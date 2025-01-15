// models/List.js
const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Card'
  }],
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board'
  }
});

const List = mongoose.model('List', listSchema);

module.exports = List;
