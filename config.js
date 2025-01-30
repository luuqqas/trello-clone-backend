const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/teste3', { 
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'Erro na conexão com o MongoDB:'));
db.once('open', () => {
  console.log('Conectado ao MongoDB');
});

module.exports = db;
