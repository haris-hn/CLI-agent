# Notes on Agentic AI and Observability

## Agentic AI Explanation
Agentic AI refers to systems where Large Language Models (LLMs) are given the autonomy to make decisions, use tools, and orchestrate workflows to achieve a goal, rather than just generating static text. In an agentic system, the AI acts as a reasoning engine. It can break down a problem, delegate tasks to specialized sub-agents, and interact with the outside world through APIs or functions (tools).

## SDK Core Concepts
Using the `@openai/agents` SDK, the core concepts include:
1. **Agent:** A configured LLM instance with specific instructions and tools. It acts as an independent entity focused on a specific domain.
2. **Runner:** The runtime environment that executes the agent loop. It automatically handles the back-and-forth between the LLM and the tools until the final output is ready.
3. **Tools (Function Calling):** Explicitly defined interfaces (often using `zod` for schema validation) that allow the LLM to execute external code (like our `calculator`).
4. **Handoffs:** The ability for an agent to return another `Agent` instance as a tool output, instructing the `Runner` to transfer control and context to the new agent.

## LLM Configuration Levels
1. **System Prompt / Instructions:** The base layer of configuration, dictating the agent's persona and constraints (e.g., "You are a Router Agent. Do not answer directly.").
2. **Few-Shot Prompting / Context:** Providing examples within the context window to guide behavior.
3. **Tool/Function Schemas:** Structuring exactly what inputs the model must provide to interact with external logic.
4. **Guardrails & Triggers:** Middleware (like `checkInputGuardrail`) or SDK-native interceptors that constrain the LLM's inputs and outputs programmatically.

## Comparison: Prompt-based vs Agent-based Systems
| Feature | Prompt-based LLM | Agent-based System |
| :--- | :--- | :--- |
| **Execution flow** | Single request/response | Iterative loop, reasoning steps |
| **Tool Usage** | None (or manually handled) | Autonomous, native tool invocation |
| **Scope of Task** | Simple, well-defined queries | Complex, multi-step, ambiguous tasks |
| **Architecture** | Single model monolithic prompt | Network of specialized, delegating agents |

---

## Part 4: Tracing & Observability

### What Tracing Shows
Tracing in the OpenAI Agents SDK captures the entire lifecycle of an agent's execution. It records:
- The initial user input.
- The specific agents invoked (spans).
- LLM generation requests and responses (prompts and tokens used).
- Tool invocations (including arguments passed and results returned).
- Handoff events and guardrail trips.

### How it Helps Debug Agent Decisions
Because agentic workflows are non-deterministic and can involve multiple hidden loops (e.g., Router -> Math Agent -> Calculator Tool -> Final Output), it can be difficult to know *why* an agent gave a specific answer. Tracing provides a granular "timeline" of the agent's "thought process." It helps developers see if the Router selected the wrong agent, if the LLM hallucinated tool arguments, or if an API call failed silently.

### What Was Observed During Execution
*Note:* During the execution of this CLI application, intentionally enabling tracing (`ENABLE_TRACING=true` in `.env`) emits observability events. By default, the SDK automatically collects these traces. By monitoring the console logs and observing the workflow:
1. When asked a math question, the Trace shows the `Router Agent` generating a tool call to `handoffToMathAgent`.
2. The `Runner` intercepts this, logs a handoff span, and invokes the `Math Agent`.
3. The `Math Agent` then generates a tool call to `calculator`. 
4. The calculator executes locally, returns the result to the LLM context, and finally, the Assistant outputs the synthesized answer.
This multi-step orchestration is completely invisible to the user without tracing, but observability makes the step-by-step logic explicit.
