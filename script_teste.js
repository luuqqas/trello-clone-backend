const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/trello_clone')
  .then(() => {
    console.log('Conectado ao MongoDB!');
    mongoose.connection.close();
  })
  .catch((error) => console.error('Erro ao conectar ao MongoDB:', error));
