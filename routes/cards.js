const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const List = require('../models/List');
const { authenticateToken } = require('./auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({ storage });

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, listId } = req.body;
    if (!content || !listId) {
      return res.status(400).json({ error: 'Os campos `content` e `listId` são obrigatórios' });
    }
    const newCard = new Card({ content, list: listId });
    await newCard.save();
    
    // Adicionar o cartão à lista
    const list = await List.findById(listId);
    if (!list) {
      return res.status(404).json({ error: 'Lista não encontrada' });
    }
    list.cards.push(newCard._id);
    await list.save();
    
    res.status(201).json(newCard);
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    res.status(500).json({ error: 'Erro ao criar cartão' });
  }
});

router.put('/move/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { newListId, newIndex } = req.body;

    console.log(`Movendo cartão ${id} para a lista ${newListId} na posição ${newIndex}`);

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    console.log('Cartão encontrado:', card);

    const oldList = await List.findById(card.list);
    const newList = await List.findById(newListId);

    if (!newList) {
      return res.status(404).json({ error: 'Nova lista não encontrada' });
    }

    console.log('Listas encontradas:', { oldList, newList });

    // Remover o cartão da lista antiga
    oldList.cards.pull(card._id);
    await oldList.save();
    console.log(`Cartão removido da lista antiga: ${oldList._id}`);

    // Adicionar o cartão à nova lista
    newList.cards.splice(newIndex, 0, card._id);
    await newList.save();
    console.log(`Cartão adicionado à nova lista: ${newList._id}`);

    // Atualizar a lista no cartão
    card.list = newListId;
    await card.save();
    console.log('Cartão atualizado:', card);

    res.status(200).json(card);
  } catch (error) {
    console.error('Erro ao mover cartão:', error);
    res.status(500).json({ error: 'Erro ao mover cartão' });
  }
});


// Adicione esta rota para atualizar o conteúdo do cartão
router.put('/:id', authenticateToken,  upload.single('file'), async (req, res) => {
  try {
    console.log('Arquivo recebido:', req.file); // Log do arquivo recebido
    console.log('Body:', req.body); // Log do conteúdo enviado no body
    const { id } = req.params;
    const { content } = req.body;

    const card = await Card.findById(id);
    if (!card) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    card.content = content;

    if (req.file) {
      card.filePath = req.file.path; // Salva o caminho do arquivo
      card.fileName = req.file.originalname; // Salva o nome original do arquivo
    }
    await card.save();

    res.status(200).json({
      content: card.content,
      fileName: card.fileName || null // Retorna o nome do arquivo, se houver
    });
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    res.status(500).json({ error: 'Erro ao atualizar cartão' });
  }
});


router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    // Remover o cartão da lista correspondente
    const list = await List.findById(card.list);
    if (list) {
      list.cards = list.cards.filter(cardId => cardId.toString() !== card._id.toString());
      await list.save();
    }

    await Card.deleteOne({ _id: card._id }); // Use deleteOne para remover o cartão
    res.status(200).json({ message: 'Cartão removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover cartão:', error);
    res.status(500).json({ error: 'Erro ao remover cartão' });
  }
});

module.exports = router;
