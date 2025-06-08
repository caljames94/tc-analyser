const express = require('express');
const router = express.Router();
const analyzerService = require('../services/analyzer');

router.post('/', async (req, res) => {
  try {
    const { text, url } = req.body;
    if (!text || !url) {
      return res.status(400).json({ error: 'Both text and URL are required' });
    }
    const analysis = await analyzerService.analyzeDocument(text, url);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;