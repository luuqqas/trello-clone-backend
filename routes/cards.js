const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const List = require('../models/List');
const { authenticateToken } = require('./auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, listId } = req.body;
    const newCard = new Card({ title, description, list: listId });
    await newCard.save();
    
    // Adicionar o cartão à lista
    const list = await List.findById(listId);
    list.cards.push(newCard.id);
    await list.save();
    
    res.status(201).json(newCard);
  } catch (error) {
    console.error('Erro ao criar cartão:', error);
    res.status(500).json({ error: 'Erro ao criar cartão' });
  }
});

router.get('/:listId', authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const cards = await Card.find({ list: listId });
    res.status(200).json(cards);
  } catch (error) {
    console.error('Erro ao buscar cartões:', error);
    res.status(500).json({ error: 'Erro ao buscar cartões' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }
    await card.remove();
    res.status(200).json({ message: 'Cartão removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover cartão:', error);
    res.status(500).json({ error: 'Erro ao remover cartão' });
  }
});

module.exports = router;
