const express = require('express');
const cors = require('cors');
const app = express();

require('./config');
const authRoutes = require('./routes/auth').router;
const boardRoutes = require('./routes/boards');
const listRoutes = require('./routes/lists');
const cardRoutes = require('./routes/cards');

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/cards', cardRoutes);

app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});
