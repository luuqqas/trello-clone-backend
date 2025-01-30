const express = require('express');
const router = express.Router();
const List = require('../models/List');
const Card = require('../models/Card');
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

// Rota para mover uma lista dentro de um quadro
router.put('/:id/move', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newIndex } = req.body;

    const list = await List.findById(id);
    if (!list) {
      return res.status(404).json({ error: 'Lista não encontrada' });
    }

    const board = await Board.findById(list.board);
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    // Remover a lista da posição atual
    board.lists.pull(list._id);
    await board.save();

    // Adicionar a lista na nova posição
    board.lists.splice(newIndex, 0, list._id);
    await board.save();

    res.status(200).json(list);
  } catch (error) {
    console.error('Erro ao mover lista:', error);
    res.status(500).json({ error: 'Erro ao mover lista' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const list = await List.findById(id);
    if (!list) {
      return res.status(404).json({ error: 'Lista não encontrada' });
    }
    list.title = title;
    await list.save();
    res.status(200).json(list);
  } catch (error) {
    console.error('Erro ao atualizar lista:', error);
    res.status(500).json({ error: 'Erro ao atualizar lista' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list) {
      return res.status(404).json({ error: 'Lista não encontrada' });
    }

    // Remover todos os cartões contidos na lista
    await Card.deleteMany({ list: list._id });

    await list.deleteOne(); 

    res.status(200).json({ message: 'Lista removida com sucesso' });
  } catch (error) {
    console.error('Erro ao remover lista:', error);
    res.status(500).json({ error: 'Erro ao remover lista' });
  }
});

module.exports = router;
