const express = require('express');
const router = express.Router();
const representativeService = require('../services/representatives');

router.get('/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    const representatives = await representativeService.getRepresentativesByPostcode(postcode);
    res.json(representatives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/email-template', async (req, res) => {
  try {
    const { postcode, analysis } = req.body;
    if (!postcode || !analysis) {
      return res.status(400).json({ error: 'Postcode and analysis are required' });
    }

    const representatives = await representativeService.getRepresentativesByPostcode(postcode);
    if (!representatives.mp) {
      return res.status(404).json({ error: 'No representative found for this postcode' });
    }

    const emailTemplate = representativeService.generateEmailTemplate(representatives.mp, analysis);
    res.json({ emailTemplate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:postcode/contacts', async (req, res) => {
  try {
    const { postcode } = req.params;
    const representatives = await representativeService.getRepresentativesByPostcode(postcode);
    
    const formattedContacts = {
      mp: representatives.mp ? representativeService.formatContactInformation(representatives.mp) : null,
      keyAuthorities: Object.entries(representatives.keyAuthorities).reduce((acc, [key, authority]) => {
        acc[key] = representativeService.formatContactInformation(authority);
        return acc;
      }, {}),
    };

    res.json(formattedContacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;