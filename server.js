const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/trello_clone', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado ao MongoDB!'))
  .catch((error) => console.error('Erro ao conectar ao MongoDB:', error));

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', boardRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
