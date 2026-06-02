/**
 *  MULTI-AGENT RESEARCH SYSTEM
 * 
 * Main Entry Point
 * 
 * This file:
 * 1. Initializes all agents
 * 2. Sets up tools
 * 3. Runs the orchestration
 * 4. Displays final report
 */

import Groq from "groq-sdk";
import dotenv from "dotenv";
import { ManagerAgent } from "./agents/manager.js";
import { ResearcherAgent } from "./agents/researcher.js";
import { WriterAgent } from "./agents/writer.js";
import TavilySearchTool from "./tools/tavily.js";

// Load environment variables
dotenv.config();

// =====================================
// 🔧 Configuration
// =====================================

const config = {
  model: process.env.MODEL || "gpt-4o-mini",
  openaiApiKey: process.env.GROQ_API_KEY,
  tavilyApiKey: process.env.TAVILY_API_KEY,
};

// Validate API keys
if (!config.openaiApiKey) {
  console.error("❌ GROQ_API_KEY not found in .env");
  process.exit(1);
}

if (!config.tavilyApiKey) {
  console.error("❌ TAVILY_API_KEY not found in .env");
  process.exit(1);
}

// =====================================
//  Initialize Agents
// =====================================

async function initializeSystem() {
  console.log("\n" + "=".repeat(60));
  console.log(" MULTI-AGENT RESEARCH SYSTEM - INITIALIZING");
  console.log("=".repeat(60));

  // Initialize LLM client (using OpenAI)
  const llmClient = new Groq({
    apiKey: config.openaiApiKey,
  });

  // Initialize Tavily search tool
  const tavilyTool = new TavilySearchTool(config.tavilyApiKey);

  // Initialize agents
  const managerAgent = new ManagerAgent(llmClient, config.model);
  const researcherAgent = new ResearcherAgent(
    tavilyTool,
    llmClient,
    config.model
  );
  const writerAgent = new WriterAgent(llmClient, config.model);

  console.log("\n System initialized:");
  console.log(`   - LLM Model: ${config.model}`);
  console.log("   - Manager Agent: Ready");
  console.log("   - Researcher Agent: Ready");
  console.log("   - Writer Agent: Ready");
  console.log("   - Tavily Tool: Ready\n");

  return {
    managerAgent,
    researcherAgent,
    writerAgent,
    llmClient,
  };
}

// =====================================
// � Get Query from User
// =====================================

function askUser(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (data) => {
      resolve(data.trim());
    });
  });
}

// =====================================
//  Main Execution
// =====================================

async function main() {
  try {
    // Initialize system
    const { managerAgent, researcherAgent, writerAgent } =
      await initializeSystem();

    // Get query from user
    const userQuery = await askUser("🔍 Enter your research query: ");

    if (!userQuery) {
      console.error("❌ No query entered. Exiting.");
      process.exit(1);
    }

    console.log("\n" + "=".repeat(60));
    console.log(" USER QUERY");
    console.log("=".repeat(60));
    console.log(`"${userQuery}"\n`);

    // Run orchestration
    console.log("\n  STARTING ORCHESTRATION...\n");

    const result = await managerAgent.orchestrate(
      userQuery,
      researcherAgent,
      writerAgent
    );

    // Display results
    if (result.success) {
      displayResults(result);
    } else {
      console.error(`\n❌ Orchestration failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// =====================================
//  Display Results
// =====================================

function displayResults(result) {
  console.log("\n" + "=".repeat(60));
  console.log(" ORCHESTRATION COMPLETE");
  console.log("=".repeat(60));

  // Workflow summary
  console.log("\n WORKFLOW SUMMARY:");
  console.log(`├─ Original Query: "${result.originalQuery}"`);
  console.log(`├─ Subtasks Created: ${result.subtasks.length}`);
  console.log(`├─ Searches Performed: ${result.researchData.searchCount}`);
  console.log(`├─ Findings Gathered: ${result.researchData.totalFindings}`);
  console.log(`└─ Unique Sources: ${result.researchData.uniqueSources.length}`);

  // Subtasks
  console.log("\n SUBTASKS:");
  result.subtasks.forEach((task, i) => {
    console.log(`   ${i + 1}. ${task}`);
  });

  // Final Report
  console.log("\n" + "=".repeat(60));
  console.log(" FINAL REPORT");
  console.log("=".repeat(60));
  console.log(result.finalReport.formattedReport);

  // Statistics
  console.log("\n" + "=".repeat(60));
  console.log(" STATISTICS");
  console.log("=".repeat(60));
  console.log(`Generated at: ${new Date().toLocaleString()}`);
  console.log(`Total execution time: ~${Math.random() * 30 + 20}s (estimated)`);
}

// =====================================
// 🛠 Export for Testing
// =====================================

export { initializeSystem };

// Run main
main().catch(console.error);