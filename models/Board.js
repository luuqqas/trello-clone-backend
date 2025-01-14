const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const boardSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  lists: [
    {
      type: Schema.Types.ObjectId,
      ref: 'List'
    }
  ]
});

module.exports = mongoose.model('Board', boardSchema);
