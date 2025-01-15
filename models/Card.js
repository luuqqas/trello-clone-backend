// models/Card.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardSchema = new Schema({
  title: String,
  description: String,
  list: { type: mongoose.Schema.Types.ObjectId, ref: 'List' }
});

const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

module.exports = Card;
