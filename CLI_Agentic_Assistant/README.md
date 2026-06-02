# CLI Agentic Assistant

This is a CLI-based agentic assistant built using the official `@openai/agents` SDK. It demonstrates multi-agent orchestration, tool calling, and guardrail logic directly in the terminal.

## Setup Instructions

1. **Install Dependencies:**
   Ensure you have Node.js installed, then run:
   ```bash
   npm install
   ```
2. **Environment Variables:**
   Copy the provided `.env` template or create a `.env` file in the root directory and add your OpenAI API Key:
   ```env
   OPENAI_API_KEY=sk-your-key-here
   ENABLE_TRACING=true
   ```

## How to Run the Project

Since this project is written in TypeScript and configured for ESM, you can compile and run it:

```bash
npx tsc
node dist/index.js
```

Or run directly using `ts-node`:
```bash
npx ts-node --esm src/index.ts
```

When the CLI starts, you can type natural language queries. Type `exit` or `quit` to stop the assistant.

## Explanation of Agent Roles

1. **Router Agent:** The orchestrator. It receives user input and determines which specialized domain agent should handle it. It is strictly instructed *not* to answer queries directly but to delegate.
2. **Math Agent:** A specialized domain agent equipped with the capability to perform mathematical calculations. It refuses to answer non-math queries.


## Explanation of Tools and Handoffs

### Tools
Tools give agents the ability to interact with external logic:
*   `calculator`: Used by the Math Agent to perform add, subtract, multiply, and divide operations safely via JavaScript instead of hallucinating math.
*   `word_counter`: Used by the Text Agent to count words in a string.

### Handoffs
Handoffs occur when an agent transfers its context and execution control to another agent. In this system:
*   The **Router Agent** is equipped with specific handoff tools (`handoffToMathAgent`, `handoffToTextAgent`). 
*   When the user asks "What is 10 + 15?", the Router Agent invokes the `handoffToMathAgent` tool.
*   The SDK's Runner intercepts this tool call, recognizes that an `Agent` instance was returned, and seamlessly transfers execution to the Math Agent, which then uses its own `calculator` tool to fulfill the request.

### Guardrail Logic
Before the input reaches the Router Agent, a custom guardrail function (`checkInputGuardrail`) validates the query against a blocklist of non-work-related topics (e.g., poems, jokes, hate speech). If triggered, the input is immediately blocked and the agent system is not invoked.
