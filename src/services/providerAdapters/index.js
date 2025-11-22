// src/services/providerAdapters/index.js
module.exports = {
  callOpenAI: require('./openai.adapter').callOpenAI,
  callGemini: require('./gemini.adapter').callGemini
};
