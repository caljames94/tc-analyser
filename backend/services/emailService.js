function composeEmail(analysis, representative) {
  const emailTemplate = `
Dear ${representative.name},

I am writing to express my concerns about the Terms and Conditions of a service I use. An analysis of these terms has revealed the following issues:

Risk Score: ${analysis.riskScore}/10

Key Concerns:
${analysis.keyConcerns.map(concern => `- ${concern}`).join('\n')}

Simplified Explanation:
${analysis.simplifiedExplanation}

Data Usage and Sharing:
${analysis.dataUsage}

I would appreciate your attention to this matter and any guidance you can provide on consumer rights in this situation.

Thank you for your time and consideration.

Sincerely,
[Your Name]
  `;

  return emailTemplate.trim();
}

module.exports = {
  composeEmail,
};
