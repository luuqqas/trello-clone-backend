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
    const list = await List.findById(listId);
    list.cards.push(newCard);
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

module.exports = router;
