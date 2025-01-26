const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BoardSchema = new Schema({
  title: {
    type: String,
    required: true // Garantir que o título é obrigatório
  },
  backgroundColor: {
    type: String,
    default: '#ffffff' // Adicionar valor padrão
  },
  textColor: {
    type: String,
    default: '#000000' // Adicionar valor padrão
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true // Garantir que o campo `createdBy` é obrigatório
  },
  lists: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'List'
  }],
  favorite: {
    type: Boolean,
    default: false // Adicionar valor padrão para favoritos
  }
});

const Board = mongoose.models.Board || mongoose.model('Board', BoardSchema);

module.exports = Board;
