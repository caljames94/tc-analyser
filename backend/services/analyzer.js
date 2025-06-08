const { Configuration, OpenAIApi } = require("openai");
const logger = require('../utils/logger');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// In-memory cache (consider using Redis for production)
const analysisCache = new Map();

const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours
const MAX_RETRIES = 3;
const CHUNK_SIZE = 2000; // Adjust based on the model's token limit

async function analyzeDocument(text, url) {
  // Check cache
  const cachedAnalysis = getCachedAnalysis(url);
  if (cachedAnalysis) {
    return cachedAnalysis;
  }

  const chunks = chunkText(text);
  let fullAnalysis = [];

  for (const chunk of chunks) {
    const chunkAnalysis = await analyzeChunk(chunk);
    fullAnalysis.push(chunkAnalysis);
  }

  const combinedAnalysis = combineAnalysis(fullAnalysis);
  cacheAnalysis(url, combinedAnalysis);

  return combinedAnalysis;
}

function chunkText(text) {
  const words = text.split(' ');
  const chunks = [];
  let currentChunk = [];

  for (const word of words) {
    if (currentChunk.length + 1 > CHUNK_SIZE) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [];
    }
    currentChunk.push(word);
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

async function analyzeChunk(chunk) {
  const prompt = `Analyze the following Terms and Conditions chunk:

${chunk}

Provide a structured analysis with the following:
1. Data collection practices
2. Data sharing with third parties
3. User rights and controls
4. Concerning clauses (arbitration, liability limits)
5. Changes to terms notification process

Format the response as a JSON object.`;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: prompt,
        max_tokens: 500,
      });

      return JSON.parse(response.data.choices[0].text);
    } catch (error) {
      logger.error(`OpenAI API error (attempt ${i + 1}):`, error);
      if (i === MAX_RETRIES - 1) throw error;
    }
  }
}

function combineAnalysis(analysisChunks) {
  // Combine and summarize the analysis from all chunks
  const combinedAnalysis = {
    riskScore: 0,
    keyConcerns: [],
    dataCollectionPractices: [],
    dataSharing: [],
    userRights: [],
    concerningClauses: [],
    changesNotification: [],
  };

  for (const chunk of analysisChunks) {
    combinedAnalysis.dataCollectionPractices.push(chunk.dataCollectionPractices);
    combinedAnalysis.dataSharing.push(chunk.dataSharing);
    combinedAnalysis.userRights.push(chunk.userRights);
    combinedAnalysis.concerningClauses.push(chunk.concerningClauses);
    combinedAnalysis.changesNotification.push(chunk.changesNotification);
  }

  // Calculate overall risk score and key concerns
  combinedAnalysis.riskScore = calculateRiskScore(combinedAnalysis);
  combinedAnalysis.keyConcerns = identifyKeyConcerns(combinedAnalysis);

  // Generate plain English summary
  combinedAnalysis.plainEnglishSummary = generatePlainEnglishSummary(combinedAnalysis);

  // Identify specific problematic clauses
  combinedAnalysis.problematicClauses = identifyProblematicClauses(combinedAnalysis);

  // Generate recommended actions
  combinedAnalysis.recommendedActions = generateRecommendedActions(combinedAnalysis);

  return combinedAnalysis;
}

function calculateRiskScore(analysis) {
  // Implement risk score calculation based on the combined analysis
  // This is a placeholder implementation
  let score = 5; // Start with a neutral score
  if (analysis.concerningClauses.length > 0) score += 2;
  if (analysis.dataSharing.some(sharing => sharing.includes('third parties'))) score += 1;
  if (analysis.userRights.some(rights => rights.includes('limited'))) score += 1;
  return Math.min(Math.max(score, 1), 10); // Ensure score is between 1 and 10
}

function identifyKeyConcerns(analysis) {
  // Implement logic to identify key concerns based on the combined analysis
  // This is a placeholder implementation
  const concerns = [];
  if (analysis.concerningClauses.length > 0) concerns.push('Concerning clauses present');
  if (analysis.dataSharing.some(sharing => sharing.includes('third parties'))) concerns.push('Data shared with third parties');
  if (analysis.userRights.some(rights => rights.includes('limited'))) concerns.push('Limited user rights');
  return concerns;
}

function generatePlainEnglishSummary(analysis) {
  // Implement logic to generate a plain English summary
  // This is a placeholder implementation
  return `This Terms and Conditions document has a risk score of ${analysis.riskScore}/10. 
  Key concerns include ${analysis.keyConcerns.join(', ')}. 
  The document outlines data collection practices, data sharing policies, and user rights. 
  Some clauses may be concerning, and you should pay attention to how changes to the terms are notified.`;
}

function identifyProblematicClauses(analysis) {
  // Implement logic to identify specific problematic clauses
  // This is a placeholder implementation
  return analysis.concerningClauses.flat();
}

function generateRecommendedActions(analysis) {
  // Implement logic to generate recommended actions based on the analysis
  // This is a placeholder implementation
  const actions = ['Carefully review the identified concerning clauses'];
  if (analysis.riskScore > 7) actions.push('Consider seeking legal advice');
  if (analysis.dataSharing.some(sharing => sharing.includes('third parties'))) actions.push('Review data sharing settings if available');
  return actions;
}

function getCachedAnalysis(url) {
  const cachedItem = analysisCache.get(url);
  if (cachedItem && (Date.now() - cachedItem.timestamp < CACHE_EXPIRATION)) {
    return cachedItem.data;
  }
  return null;
}

function cacheAnalysis(url, analysis) {
  analysisCache.set(url, {
    timestamp: Date.now(),
    data: analysis,
  });
}

module.exports = {
  analyzeDocument,
};