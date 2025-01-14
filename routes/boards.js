const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const authenticateToken = require('../middlewares/auth');

// Criar novo quadro (rota protegida)
router.post('/boards', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const newBoard = new Board({ name });
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar quadro' });
  }
});

// Obter todos os quadros (rota protegida)
router.get('/boards', authenticateToken, async (req, res) => {
  try {
    const boards = await Board.find().populate('lists');
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar quadros' });
  }
});

module.exports = router;
