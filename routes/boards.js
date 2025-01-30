const express = require('express');
const router = express.Router();
const Board = require('../models/Board');
const User = require('../models/User');
const List = require('../models/List');
const Card = require('../models/Card');
const { authenticateToken } = require('../routes/auth');
const checkPermissions = require('../middlewares/permissions');

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

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'Esse e-mail não está cadastrado.' });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ error: 'Esse e-mail pertence a você.' });
    }

    const board = await Board.findById(id);
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    const sharedUser = board.sharedWith.find(u => u.user.toString() === user._id.toString());
    if (sharedUser) {
      return res.status(400).json({ error: 'Você já está compartilhando esse quadro com esse usuário.' });
    }

    board.sharedWith.push({ user: user._id, mode });
    await board.save();

    res.status(200).json({ message: 'Quadro compartilhado com sucesso' });
  } catch (error) {
    console.error('Erro ao compartilhar quadro:', error);
    res.status(500).json({ error: 'Erro ao compartilhar quadro' });
  }
});


router.get('/shared-with-me', authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      throw new Error('Usuário não autenticado');
    }
    console.log('Buscando quadros compartilhados para o usuário:', req.user.id);
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
    if (!req.user || !req.user.id) {
      throw new Error('Usuário não autenticado');
    }
    console.log('Buscando quadros para o usuário:', req.user.id);
    const boards = await Board.find({ createdBy: req.user.id }).populate('lists');
    res.status(200).json(boards);
  } catch (error) {
    console.error('Erro ao buscar quadros:', error);
    res.status(500).json({ error: 'Erro ao buscar quadros' });
  }
});


// Rota para visualizar um quadro
router.get('/:boardId', authenticateToken, checkPermissions('view'), async (req, res) => {
  try {
    const board = await Board.findById(req.params.boardId)
      .populate('lists')
      .populate({
        path: 'lists',
        populate: { path: 'cards' }
      });

    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar quadro' });
  }
});

// Rota para editar um quadro
// Rota para editar um quadro
router.put('/:boardId', authenticateToken, checkPermissions('edit'), async (req, res) => {
  try {
    const { title, backgroundColor, textColor, lists, favorite } = req.body;
    const board = await Board.findByIdAndUpdate(
      req.params.boardId,
      { title, backgroundColor, textColor, lists, favorite },
      { new: true }
    );
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar quadro' });
  }
});

// Rota para favoritar/desfavoritar um quadro
router.put('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findOne({ _id: id });
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    // Verificar se o quadro é compartilhado com o usuário
    const sharedWithUser = board.sharedWith.find(sw => sw.user.toString() === req.user.id);
    if (!sharedWithUser && board.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (sharedWithUser) {
      sharedWithUser.favorite = !sharedWithUser.favorite;
    } else {
      board.favorite = !board.favorite;
    }

    await board.save();
    res.status(200).json(board);
  } catch (error) {
    console.error('Erro ao favoritar quadro:', error);
    res.status(500).json({ error: 'Erro ao favoritar quadro' });
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

// Rota para atualizar título e cores do quadro
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


// Rota para atualizar o título do quadro
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'O título é obrigatório.' });
    }

    const board = await Board.findByIdAndUpdate(
      id,
      { title },
      { new: true }
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




// Rota para reordenar listas no quadro
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

// Rota para favoritar/desfavoritar um quadro
// Rota para favoritar/desfavoritar um quadro
router.put('/:id/favorite', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const board = await Board.findOne({ _id: id });
    if (!board) {
      return res.status(404).json({ error: 'Quadro não encontrado' });
    }

    // Verificar se o quadro é compartilhado com o usuário
    const sharedWithUser = board.sharedWith.find(sw => sw.user.toString() === req.user.id);
    if (!sharedWithUser && board.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (sharedWithUser) {
      sharedWithUser.favorite = !sharedWithUser.favorite;
    } else {
      board.favorite = !board.favorite;
    }

    await board.save();
    res.status(200).json(board);
  } catch (error) {
    console.error('Erro ao favoritar quadro:', error);
    res.status(500).json({ error: 'Erro ao favoritar quadro' });
  }
});


module.exports = router;
