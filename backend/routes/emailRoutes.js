const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

router.post('/compose', async (req, res) => {
  try {
    const { analysis, representative } = req.body;
    if (!analysis || !representative) {
      return res.status(400).json({ error: 'Analysis and representative are required' });
    }
    const emailTemplate = await emailService.composeEmail(analysis, representative);
    res.json({ emailTemplate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;