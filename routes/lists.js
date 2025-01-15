const express = require('express');
const router = express.Router();
const List = require('../models/List');
const Board = require('../models/Board');
const { authenticateToken } = require('./auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, boardId } = req.body;
    const newList = new List({ name, board: boardId });
    await newList.save();
    const board = await Board.findById(boardId);
    board.lists.push(newList);
    await board.save();
    res.status(201).json(newList);
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    res.status(500).json({ error: 'Erro ao criar lista' });
  }
});

router.get('/:boardId', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const lists = await List.find({ board: boardId }).populate('cards');
    res.status(200).json(lists);
  } catch (error) {
    console.error('Erro ao buscar listas:', error);
    res.status(500).json({ error: 'Erro ao buscar listas' });
  }
});

module.exports = router;
