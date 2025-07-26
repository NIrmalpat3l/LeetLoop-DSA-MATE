// Groq Supported Models (as of 2025)
// Use one of these models instead of deprecated ones

export const SUPPORTED_GROQ_MODELS = {
  // Latest recommended models (2025)
  LLAMA_3_3_70B: 'llama-3.3-70b-versatile',     // Latest, high quality
  LLAMA_3_2_90B: 'llama-3.2-90b-text-preview',  // Very high quality
  LLAMA_3_2_11B: 'llama-3.2-11b-text-preview',  // Good balance
  LLAMA_3_2_3B: 'llama-3.2-3b-preview',         // Fast
  LLAMA_3_2_1B: 'llama-3.2-1b-preview',         // Very fast
  
  // Gemma models
  GEMMA_7B: 'gemma-7b-it',                       // Google's model
  GEMMA_2_9B: 'gemma2-9b-it',                    // Updated Gemma model
  
  // Specialized models
  LLAMA_3_1_8B: 'llama3-8b-8192',               // Fast general purpose
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',           // If still available
};

// Current model being used in the application
export const CURRENT_MODEL = SUPPORTED_GROQ_MODELS.LLAMA_3_3_70B;

console.log('Available Groq models:', SUPPORTED_GROQ_MODELS);
console.log('Currently using:', CURRENT_MODEL);
