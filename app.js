const express = require('express');
const cors = require('cors');
const app = express();

require('./config');
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');

app.use(cors());
app.use(express.json());
app.use('/boards', boardRoutes);
app.use('/lists', listRoutes);
app.use('/cards', cardRoutes);

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
