import { tool } from '@openai/agents';
import { z } from 'zod';

export const calculatorTool = tool({
    name: 'calculator',
    description: 'Perform basic math operations like add, subtract, multiply, and divide.',
    parameters: z.object({
        operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe("The math operation to perform"),
        a: z.number().describe("The first number"),
        b: z.number().describe("The second number"),
    }),
    execute: async (args: { operation: string; a: number; b: number }) => {
        console.log(`[Tool Usage] Using calculator to ${args.operation} ${args.a} and ${args.b}`);
        switch (args.operation) {
            case 'add': return String(args.a + args.b);
            case 'subtract': return String(args.a - args.b);
            case 'multiply': return String(args.a * args.b);
            case 'divide': 
                if (args.b === 0) return 'Error: Division by zero';
                return String(args.a / args.b);
            default:
                return 'Error: Invalid operation';
        }
    }
});

export const wordCounterTool = tool({
    name: 'word_counter',
    description: 'Counts the number of words in a given text.',
    parameters: z.object({
        text: z.string()
    }),
    execute: async (args: { text: string }) => {
        console.log(`[Tool Usage] Using word_counter on string of length ${args.text.length}`);
        const count = args.text.trim().split(/\s+/).filter(word => word.length > 0).length;
        return String(count);
    }
});
