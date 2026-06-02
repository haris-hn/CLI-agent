import { Agent, OpenAIChatCompletionsModel, tool } from '@openai/agents';
import OpenAI from 'openai';
import { calculatorTool, wordCounterTool } from './tools.js';
import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

let model: any = undefined;

if (process.env.GROQ_API_KEY) {
    const groqClient = new OpenAI({
        apiKey: process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
    });
    const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
    model = new OpenAIChatCompletionsModel(groqClient as any, modelName);
    console.log(`[Config] Using Groq model: ${modelName}`);
} else {
    console.log('[Config] Using default OpenAI model via SDK.');
}

export const mathAgent = new Agent({
    name: 'Math Agent',
    instructions: 'You are a specialized Math Agent. Use the calculator tool to answer math-related queries. ONLY answer math questions. If asked anything else, politely decline.',
    tools: [calculatorTool],
    model: model
});

export const textAgent = new Agent({
    name: 'Text Agent',
    instructions: 'You are a specialized Text Processing Agent. Use the word_counter tool to count words in text. ONLY handle text processing requests.',
    tools: [wordCounterTool],
    model: model
});

// Create handoff tools
export const handoffToMathAgent = tool({
    name: 'handoffToMathAgent',
    description: 'Use this to hand off the user query to the Math Agent.',
    parameters: z.object({
        handoff_confirmed: z.boolean().describe("Set to true to confirm handoff")
    }),
    execute: async () => {
        return mathAgent; // Return the agent instance to signal handoff to the Runner
    }
});

export const handoffToTextAgent = tool({
    name: 'handoffToTextAgent',
    description: 'Use this to hand off the user query to the Text Agent ONLY if the user explicitly wants to count words in a text.',
    parameters: z.object({
        handoff_confirmed: z.boolean().describe("Set to true to confirm handoff")
    }),
    execute: async () => {
        return textAgent; // Return the agent instance to signal handoff to the Runner
    }
});

export const routerAgent = new Agent({
    name: 'Router Agent',
    instructions: `You are a Router Agent. Your SOLE purpose is to read the user input and decide which specialized domain agent should handle the task.
You MUST NOT answer the user's query directly. 
If the user asks a math calculation, use the handoffToMathAgent tool.
If the user asks to COUNT WORDS in a text, use the handoffToTextAgent tool. Do NOT use the Text Agent for general knowledge, trivia, or answering questions.
If the query is a general question (like trivia) or does not strictly fit math or word counting, you MUST reply that you cannot handle it and DO NOT use any handoff tools.`,
    tools: [handoffToMathAgent, handoffToTextAgent],
    model: model
});
