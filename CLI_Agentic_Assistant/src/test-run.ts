import { Runner } from '@openai/agents';
import { routerAgent } from './agents.js';
import * as dotenv from 'dotenv';

dotenv.config();

async function test() {
    const runner = new Runner();
    console.log('Running test query with Runner...');
    
    // We can monitor stream events to see the turns
    const stream = await runner.run(routerAgent, 'what is value of pi?', { stream: true });
    
    for await (const event of stream) {
        console.log(`[Event] Type: ${event.type} -> ${JSON.stringify(event)}`);
    }
}

test().catch(console.error);
