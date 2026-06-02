import * as readline from 'readline';
import { Runner } from '@openai/agents';
import { routerAgent } from './agents.js';
import { checkInputGuardrail } from './guardrails.js';
import * as dotenv from 'dotenv';

dotenv.config();

// Tracing Setup
// In the @openai/agents SDK, tracing is enabled by default. We can control or observe it.
const enableTracing = process.env.ENABLE_TRACING === 'true';

if (enableTracing) {
    console.log('[Tracing] Tracing is intentionally enabled. Observability data will be available in the OpenAI dashboard.');
} else {
    console.log('[Tracing] Tracing is disabled.');
    // Normally you would pass runOptions or set environment variables to disable it in the SDK.
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log(`
============================================
🤖 CLI Agentic Assistant Initialized
============================================
Type your query below. Type 'exit' to quit.
`);

function askQuestion() {
    rl.question('\nUser: ', async (input) => {
        if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
            console.log('Goodbye!');
            rl.close();
            return;
        }

        // 1. Guardrail Check
        const guardrailResult = checkInputGuardrail(input);
        if (!guardrailResult.allowed) {
            console.log(`\n[Guardrail Blocked] ${guardrailResult.reason}`);
            askQuestion();
            return;
        }

        console.log('\n[Router] Processing query...');
        
        try {
            // 2. Execute through Router Agent
            // The Router Agent will hand off to Math or Text agent based on tools configured.
            
            // We use the Runner from @openai/agents to handle the loop
            const runner = new Runner();

            const result = await runner.run(routerAgent, input);
            
            // output the final text
            console.log(`\nAssistant: ${result.finalOutput}`);

        } catch (error: any) {
            console.error('\n[Error] Failed to process query:', error.message);
            if (error.error) console.error(JSON.stringify(error.error, null, 2));
            if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
        }

        askQuestion();
    });
}

askQuestion();
