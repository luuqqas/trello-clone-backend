// models/Card.js
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
  },
  filePath: { type: String, default: null }, // Caminho do arquivo salvo
  fileName: { type: String, default: null }, // Nome do arquivo
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

CardSchema.pre('save', function(next) {
  if (this.isModified('content') || this.isModified('list') || this.isModified('filePath') || this.isModified('fileName')) {
    this.updatedAt = Date.now();
  }
  next();
});

const Card = mongoose.models.Card || mongoose.model('Card', CardSchema);

module.exports = Card;
