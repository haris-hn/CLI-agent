// src/guardrails.ts

/**
 * A simple guardrail function to check if the user input is appropriate.
 * It will block non-work-related or unsafe queries.
 */
export function checkInputGuardrail(input: string): { allowed: boolean; reason?: string } {
    const lowerInput = input.toLowerCase();

    // Blocklist of inappropriate or non-work-related topics
    const blocklist = ['poem', 'love', 'joke', 'hate', 'kill', 'swear'];

    for (const word of blocklist) {
        if (lowerInput.includes(word)) {
            return {
                allowed: false,
                reason: `Input contains blocked or non-work-related content related to: '${word}'.`
            };
        }
    }

    // Optional: We could also do an LLM call here to classify the intent, 
    // but a simple rules-based guardrail suffices for this demonstration.

    return { allowed: true };
}
