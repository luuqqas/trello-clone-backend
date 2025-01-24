const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardSchema = new Schema({
  content: {
    type: String,
    required: true
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true
  }
});

const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

module.exports = Card;
