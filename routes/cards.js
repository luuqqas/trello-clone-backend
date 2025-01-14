const express = require('express');
const router = express.Router();
const Card = require('../models/Card');

router.get('/', async (req, res) => {
  const cards = await Card.find();
  res.json(cards);
});

router.post('/', async (req, res) => {
  const card = new Card(req.body);
  await card.save();
  res.json(card);
});

module.exports = router;
