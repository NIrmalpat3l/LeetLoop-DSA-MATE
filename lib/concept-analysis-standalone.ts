import axios from 'axios';
import { config } from 'dotenv';
import { format, addDays } from 'date-fns';

config(); // Load .env file

type Submission = {
  problem_name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  submission_date: string; // format: YYYY-MM-DD
  attempts: number;
  hints_used: boolean;
  concept_reused_recently: boolean;
};

type RevisionResult = {
  problem: string;
  concepts: string[];
  description: string;
  estimated_next_recall_date: string;
  reasoning: string;
};

// Prompt generator
const generatePrompt = (sub: Submission): string => `
You are a LeetCode assistant. For the problem "${sub.problem_name}", provide:
1. A brief explanation of the solution logic.
2. List of core concepts (like DP, sliding window, graphs, etc).
3. Estimate the number of days after which the user should review the concept again using spaced repetition, taking into account:
   - Difficulty: ${sub.difficulty}
   - Submission Date: ${sub.submission_date}
   - Attempts: ${sub.attempts}
   - Hints Used: ${sub.hints_used ? 'Yes' : 'No'}
   - Concept reused recently: ${sub.concept_reused_recently ? 'Yes' : 'No'}

Use the spaced repetition baseline:
Easy: 7 days, Medium: 14 days, Hard: 30 days.
Modify based on user's effort, concept frequency, and time since submission.

Return a JSON object in this format:
{
  "problem": "<problem name>",
  "concepts": ["<concept1>", "<concept2>", ...],
  "description": "<short 2-3 sentence explanation>",
  "estimated_next_recall_date": "<YYYY-MM-DD>",
  "reasoning": "<explain why you chose that recall date>"
}
`;

// Call Groq API (e.g., using Mixtral)
async function getRevisionDetails(sub: Submission): Promise<RevisionResult> {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile', // Updated to latest supported model
      messages: [{ role: 'user', content: generatePrompt(sub) }],
      temperature: 0.5,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const output = response.data.choices[0].message.content;

  try {
    return JSON.parse(output);
  } catch (error) {
    console.error('❌ Failed to parse LLM response:', output);
    throw new Error('Invalid JSON returned from Groq');
  }
}

// Main
async function main() {
  const submissions: Submission[] = [
    {
      problem_name: 'Longest Substring Without Repeating Characters',
      difficulty: 'Medium',
      submission_date: '2025-07-22',
      attempts: 2,
      hints_used: false,
      concept_reused_recently: true,
    },
    {
      problem_name: 'Word Ladder',
      difficulty: 'Hard',
      submission_date: '2025-07-21',
      attempts: 4,
      hints_used: true,
      concept_reused_recently: false,
    },
    {
      problem_name: 'Two Sum',
      difficulty: 'Easy',
      submission_date: '2025-07-25',
      attempts: 1,
      hints_used: false,
      concept_reused_recently: false,
    },
  ];

  for (const sub of submissions) {
    try {
      const result = await getRevisionDetails(sub);
      console.log('\n🧠 Revision Suggestion');
      console.log(`📌 Problem: ${result.problem}`);
      console.log(`📚 Concepts: ${result.concepts.join(', ')}`);
      console.log(`📝 Description: ${result.description}`);
      console.log(`📅 Next Review: ${result.estimated_next_recall_date}`);
      console.log(`🔍 Reason: ${result.reasoning}`);
    } catch (err: any) {
      console.error('❗ Error during revision scheduling:', err.message || err);
    }
  }
}

// Only run if called directly (not when imported)
if (require.main === module) {
  main();
}

export { getRevisionDetails, generatePrompt, type Submission, type RevisionResult };
