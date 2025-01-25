const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const List = require('../models/List');
const Card = require('../models/Card');
const { authenticateToken } = require('./auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, backgroundColor, textColor } = req.body;
    const newBoard = new Board({
      title: title || 'Novo Quadro',
      backgroundColor: backgroundColor || '#ffffff',
      textColor: textColor || '#000000',
      createdBy: req.user.id // Certifique-se de que este campo está sendo definido corretamente
    });
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (error) {
    console.error('Erro ao criar quadro:', error);
    res.status(500).json({ error: 'Erro ao criar quadro' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const boards = await Board.find({ createdBy: req.user.id }).populate('lists');
    res.status(200).json(boards);
  } catch (error) {
    console.error('Erro ao buscar quadros:', error);
    res.status(500).json({ error: 'Erro ao buscar quadros' });
  }
});

router.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate('lists');
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    if (board.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Remover todas as listas e os cartões associados ao quadro
    for (const listId of board.lists) {
      const list = await List.findById(listId);
      if (list) {
        await Card.deleteMany({ list: list._id });
        await list.deleteOne();
      }
    }

    await board.deleteOne();
    res.status(200).json({ message: 'Quadro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover quadro:', error);
    res.status(500).json({ error: 'Erro ao remover quadro' });
  }
});

router.put('/:boardId/lists/reorder', authenticateToken, async (req, res) => {
  try {
    const { boardId } = req.params;
    const { listsOrder } = req.body;

    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    board.lists = listsOrder;
    await board.save();

    res.status(200).json(board);
  } catch (error) {
    console.error('Erro ao reordenar listas:', error);
    res.status(500).json({ error: 'Erro ao reordenar listas' });
  }
});



module.exports = router;
