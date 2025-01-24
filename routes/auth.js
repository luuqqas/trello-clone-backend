const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Função de Autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  jwt.verify(token, 'secreta', (err, user) => { // Certifique-se de que a string secreta é a mesma utilizada durante a geração do token
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = { id: user.id };
    next();
  });
  
}

// Rota de Registro
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'Usuário registrado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Rota de Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const accessToken = jwt.sign({ id: user._id, email: user.email }, 'secreta', { expiresIn: '1h' }); // Certifique-se de que a string secreta é a mesma
  res.json({ accessToken });
});

module.exports = { router, authenticateToken };
