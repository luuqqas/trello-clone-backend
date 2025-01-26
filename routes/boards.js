const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const User = require('../models/User');
const List = require('../models/List');
const Card = require('../models/Card');
const { authenticateToken } = require('./auth');

// Rota para criar um novo quadro
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, backgroundColor, textColor } = req.body;
    const newBoard = new Board({
      title: title || 'Novo Quadro',
      backgroundColor: backgroundColor || '#ffffff',
      textColor: textColor || '#000000',
      createdBy: req.user.id
    });
    await newBoard.save();
    res.status(201).json(newBoard);
  } catch (error) {
    console.error('Erro ao criar quadro:', error);
    res.status(500).json({ error: 'Erro ao criar quadro' });
  }
});


// Rota para compartilhar o quadro
router.post('/:id/share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, mode } = req.body;

    // Encontre o usuário pelo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Esse e-mail não está cadastrado.' });
    }

    // Verifique se o e-mail é do próprio usuário
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Esse e-mail pertence a você.' });
    }

    // Encontre o quadro pelo ID
    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    // Verifique se o usuário já está compartilhado com o quadro
    const sharedUser = board.sharedWith.find(u => u.user.toString() === user._id.toString());
    if (sharedUser) {
      return res.status(400).json({ error: 'Você já está compartilhando esse quadro com esse usuário.' });
    }

    // Adicione o usuário à lista de compartilhamento do quadro
    board.sharedWith.push({ user: user._id, mode });
    await board.save();
    
    res.status(200).json({ message: 'Quadro compartilhado com sucesso' });
  } catch (error) {
    console.error('Erro ao compartilhar quadro:', error);
    res.status(500).json({ error: 'Erro ao compartilhar quadro' });
  }
});

// Rota para buscar quadros compartilhados com o usuário
router.get('/shared-with-me', authenticateToken, async (req, res) => {
  try {
    const boards = await Board.find({ 'sharedWith.user': req.user.id }).populate('lists');
    res.status(200).json(boards);
  } catch (error) {
    console.error('Erro ao buscar quadros compartilhados com você:', error);
    res.status(500).json({ error: 'Erro ao buscar quadros compartilhados com você' });
  }
});

// Rota para remover compartilhamento de um quadro
router.put('/:id/remove-share', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    board.sharedWith = board.sharedWith.filter(sharedUser => sharedUser.user.toString() !== req.user.id);

    await board.save();
    res.status(200).json({ message: 'Compartilhamento removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover compartilhamento do quadro:', error);
    res.status(500).json({ error: 'Erro ao remover compartilhamento do quadro' });
  }
});



// Rota para buscar todos os quadros
router.get('/', authenticateToken, async (req, res) => {
  try {
    const boards = await Board.find({ createdBy: req.user.id }).populate('lists');
    res.status(200).json(boards);
  } catch (error) {
    console.error('Erro ao buscar quadros:', error);
    res.status(500).json({ error: 'Erro ao buscar quadros' });
  }
});

// Rota para remover um quadro
router.delete('/delete/:id', authenticateToken, async (req, res) => {
  try {
    const board = await Board.findById(req.params.id).populate('lists');
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    if (board.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

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

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params; // Obter o ID do quadro da URL
    const { title } = req.body; // Obter o título do corpo da requisição

    if (!title) {
      return res.status(400).json({ error: 'O título é obrigatório.' });
    }

    // Atualizar o título do quadro
    const board = await Board.findByIdAndUpdate(
      id,
      { title }, // Somente o título será atualizado
      { new: true } // Retorna o documento atualizado
    );

    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado.' });
    }

    res.status(200).json({ message: 'Título do quadro atualizado com sucesso.', board });
  } catch (error) {
    console.error('Erro ao atualizar título do quadro:', error);
    res.status(500).json({ error: 'Erro ao atualizar título do quadro.' });
  }
});

router.put('/color/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { backgroundColor, textColor } = req.body;

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    if (backgroundColor !== undefined) {
      board.backgroundColor = backgroundColor;
    }
    if (textColor !== undefined) {
      board.textColor = textColor;
    }

    await board.save();
    res.status(200).json(board);
  } catch (error) {
    console.error('Erro ao atualizar quadro:', error);
    res.status(500).json({ error: 'Erro ao atualizar quadro' });
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

// Rota para atualizar o título do quadro
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    board.title = title;
    await board.save();

    res.status(200).json(board);
  } catch (error) {
    console.error('Erro ao atualizar título do quadro:', error);
    res.status(500).json({ error: 'Erro ao atualizar título do quadro' });
  }
});

// Rota para favoritar/desfavoritar um quadro
// Rota para favoritar/desfavoritar um quadro
router.put('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    board.favorite = !board.favorite;
    await board.save();

    res.status(200).json(board);
  } catch (error) {
    console.error('Erro ao favoritar quadro:', error);
    res.status(500).json({ error: 'Erro ao favoritar quadro' });
  }
});


module.exports = router;
