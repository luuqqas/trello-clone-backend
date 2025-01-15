const express = require('express');
const router = express.Router();
const List = require('../models/List');
const Board = require('../models/Board');
const { authenticateToken } = require('./auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, boardId } = req.body;
    const newList = new List({ title, board: boardId });
    await newList.save();
    
    // Adicionar a lista ao quadro
    const board = await Board.findById(boardId);
    board.lists.push(newList.id);
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

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ error: 'Lista não encontrada' });
    }
    await list.remove();
    res.status(200).json({ message: 'Lista removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover lista:', error);
    res.status(500).json({ error: 'Erro ao remover lista' });
  }
});

module.exports = router;
