const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const { authenticateToken } = require('./auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    const newBoard = new Board({ name });
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (error) {
    console.error('Erro ao criar quadro:', error);
    res.status(500).json({ error: 'Erro ao criar quadro' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const boards = await Board.find().populate('lists');
    res.status(200).json(boards);
  } catch (error) {
    console.error('Erro ao buscar quadros:', error);
    res.status(500).json({ error: 'Erro ao buscar quadros' });
  }
});

module.exports = router;
