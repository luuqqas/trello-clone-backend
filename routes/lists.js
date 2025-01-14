const express = require('express');
const router = express.Router();
const List = require('../models/List');

router.get('/', async (req, res) => {
  const lists = await List.find().populate('cards');
  res.json(lists);
});

router.post('/', async (req, res) => {
  const list = new List(req.body);
  await list.save();
  res.json(list);
});

module.exports = router;
