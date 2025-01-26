// models/List.js
const mongoose = require('mongoose');

const ListSchema = new Schema({
  title: String,
  board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board' },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }]
});

const List = mongoose.models.List || mongoose.model('List', ListSchema);

module.exports = List;
