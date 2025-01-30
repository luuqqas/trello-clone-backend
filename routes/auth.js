const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Função de Autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  console.log('Cabeçalho Authorization recebido:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    console.error('Token ausente no cabeçalho Authorization');
    return res.status(401).json({ error: 'Acesso negado' });
  }

  jwt.verify(token, 'secreta', (err, user) => {
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
// Rota de Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const accessToken = jwt.sign({ id: user._id, email: user.email }, 'secreta', { expiresIn: '1h' });
  res.json({ user, accessToken }); 
});

// Rota para solicitar reset de senha
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    console.log('Email recebido do frontend:', email); 
console.log('Usuário encontrado:', user); 
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Gerar token e expiração
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
    await user.save();
    
    console.log('Token:',user.resetPasswordToken);
    // Enviar email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    console.log('Enviando email para:', user.email);
    console.log('Reset URL:', resetUrl);

    await transporter.sendMail({
      from: `"Suporte do Sistema" <${process.env.EMAIL_SENDER}>`, 
      to: user.email,
      subject: 'Redefinição de Senha',
      html: `Você solicitou a redefinição da sua senha. Clique aqui para redefinir: ${resetUrl}`
    }, (error, info) => {
      if (error) {
        console.log('Erro ao enviar e-mail:', error);
        return res.status(500).json({ error: 'Erro ao enviar o e-mail de redefinição' });
      } else {
        console.log('E-mail enviado:', info.response);
      }
    });

    res.json({ message: 'Email de redefinição enviado' });
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
});

// Rota para resetar a senha
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado' });
    }

    // Atualizar senha
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao redefinir senha' });
  }
});

module.exports = { router, authenticateToken };
