const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/teste3')
  .then(() => {
    console.log('Conectado ao MongoDB!');
    mongoose.connection.close();
  })
  .catch((error) => console.error('Erro ao conectar ao MongoDB:', error));
