const axios = require('axios');
const logger = require('../utils/logger');

// In-memory cache (consider using Redis for production)
const representativeCache = new Map();
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours

// Placeholder for postcode database (you would need to implement or use a real database)
const postcodeDatabase = new Map();

// Fallback government contacts
const fallbackContacts = {
  OAIC: {
    name: 'Office of the Australian Information Commissioner',
    email: 'enquiries@oaic.gov.au',
    phone: '1300 363 992',
    address: 'GPO Box 5218, Sydney NSW 2001',
  },
  ACCC: {
    name: 'Australian Competition and Consumer Commission',
    email: 'infocentre@accc.gov.au',
    phone: '1300 302 502',
    address: 'GPO Box 3131, Canberra ACT 2601',
  },
  AGD: {
    name: "Attorney-General's Department",
    email: 'privacy@ag.gov.au',
    phone: '(02) 6141 6666',
    address: '3-5 National Circuit, Barton ACT 2600',
  },
  DRW: {
    name: 'Digital Rights Watch Australia',
    email: 'info@digitalrightswatch.org.au',
    phone: '',
    address: 'PO Box 1908, Fitzroy VIC 3065',
  },
};

async function getRepresentativesByPostcode(postcode) {
  if (!isValidAustralianPostcode(postcode)) {
    throw new Error('Invalid Australian postcode');
  }

  // Check cache
  const cachedData = getCachedRepresentative(postcode);
  if (cachedData) {
    return cachedData;
  }

  try {
    // This is a placeholder. You would need to implement or use an actual API for Australian MP lookup.
    const response = await axios.get(`https://api.example.com/representatives/${postcode}`);
    const mpData = response.data;

    const representativeData = {
      mp: {
        name: mpData.name,
        electorate: mpData.electorate,
        party: mpData.party,
        email: mpData.email,
        phone: mpData.phone,
        officeAddress: mpData.officeAddress,
      },
      keyAuthorities: {
        OAIC: fallbackContacts.OAIC,
        ACCC: fallbackContacts.ACCC,
        PMO: {
          name: "Prime Minister's Office",
          email: 'your.pm@aph.gov.au',
          phone: '(02) 6277 7700',
          address: 'Parliament House, Canberra ACT 2600',
        },
      },
    };

    cacheRepresentative(postcode, representativeData);
    return representativeData;
  } catch (error) {
    logger.error(`Error fetching representative data: ${error.message}`);
    return {
      mp: null,
      keyAuthorities: fallbackContacts,
    };
  }
}

function isValidAustralianPostcode(postcode) {
  const postcodeNum = parseInt(postcode, 10);
  return !isNaN(postcodeNum) && postcodeNum >= 2000 && postcodeNum <= 9999;
}

function getCachedRepresentative(postcode) {
  const cachedItem = representativeCache.get(postcode);
  if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_EXPIRATION)) {
    return cachedItem.data;
  }
  return null;
}

function cacheRepresentative(postcode, data) {
  representativeCache.set(postcode, {
    timestamp: Date.now(),
    data: data,
  });
}

function generateEmailTemplate(mpData, analysis) {
  const template = `
Dear ${mpData.name},

Subject: Concerns Regarding Terms and Conditions and Privacy Practices

I am writing to you as a constituent in the electorate of ${mpData.electorate} to express my concerns about the Terms and Conditions and privacy practices of a service I use.

An analysis of these terms has revealed the following issues:

${analysis.keyConcerns.map(concern => `- ${concern}`).join('\n')}

These practices raise significant concerns in light of the Australian Privacy Principles outlined in the Privacy Act 1988 and the consumer protections provided by the Australian Consumer Law.

I would appreciate your attention to this matter and request that you consider reviewing these practices and their alignment with current Australian privacy and consumer protection laws.

Thank you for your time and consideration of this important issue.

Sincerely,
[Your Name]
[Your Address]
  `;

  return template.trim();
}

function formatContactInformation(contact) {
  return `
${contact.name}
Email: ${contact.email}
Phone: ${contact.phone}
Address: ${contact.address}
  `.trim();
}

module.exports = {
  getRepresentativesByPostcode,
  generateEmailTemplate,
  formatContactInformation,
};