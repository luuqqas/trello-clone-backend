// models/Card.js
const mongoose = require('mongoose');

const CardSchema = new Schema({
  content: {
    type: String,
    required: true
  },
  list: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List',
    required: true
  },
  filePath: { type: String, default: null }, // Caminho do arquivo salvo
  fileName: { type: String, default: null } // Nome do arquivo

});

const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

module.exports = Card;
