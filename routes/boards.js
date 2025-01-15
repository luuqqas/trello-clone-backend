const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
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


router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Requisição para remover quadro recebida:', req.params.id);
    console.log('Usuário autenticado:', req.user);

    const board = await Board.findById(req.params.id).populate('createdBy');
    console.log('Board encontrado:', board);

    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    if (!req.user) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (!board.createdBy || !board.createdBy.id) {
      return res.status(500).json({ error: 'Erro ao identificar o criador do quadro' });
    }

    console.log('ID do criador do quadro:', board.createdBy.id.toString());
    console.log('ID do usuário autenticado:', req.user.id);
    if (board.createdBy.id.toString() !== req.user.id) {
      console.log('Acesso negado: usuário não é o criador do quadro');
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await Board.deleteOne({ id: req.params.id }); // Use deleteOne para remover o quadro
    res.status(200).json({ message: 'Quadro removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover quadro:', error);
    res.status(500).json({ error: 'Erro ao remover quadro' });
  }
});


router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, backgroundColor, textColor, favorite } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }
    if (board.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    board.title = title || board.title;
    board.backgroundColor = backgroundColor || board.backgroundColor;
    board.textColor = textColor || board.textColor;
    board.favorite = favorite !== undefined ? favorite : board.favorite;
    await board.save();
    res.status(200).json(board);
  } catch (error) {
    console.error('Erro ao atualizar quadro:', error);
    res.status(500).json({ error: 'Erro ao atualizar quadro' });
  }
});

module.exports = router;
