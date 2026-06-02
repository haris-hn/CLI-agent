# 🎯 Multi-Agent Research System

A multi-agent AI system that researches real-world topics using agent orchestration, specialized agent roles, and live web search via Tavily.

---

## 🏗️ Architecture

```
User Query
    ↓
👨‍💼 Manager Agent       → Breaks query into subtasks, delegates work
    ↓
🔬 Researcher Agent     → Calls Tavily Search, returns facts + sources
    ↓
✍️  Writer Agent         → Reasons over research, writes final report
    ↓
📄 Final Report
```

### Agent Responsibilities

| Responsibility        | Manager | Researcher | Writer |
|-----------------------|---------|------------|--------|
| Call Tavily Search    | ❌      | ✅         | ❌     |
| Write final report    | ❌      | ❌         | ✅     |
| Delegate subtasks     | ✅      | ❌         | ❌     |
| Invent facts          | ❌      | ❌         | ❌     |

---

## 🚀 Setup

### 1. Prerequisites
- Node.js 18+
- Groq API key → https://console.groq.com/keys (free)
- Tavily API key → https://tavily.com (free tier available)

### 2. Install

```bash
npm install
```

### 3. Configure `.env`

```env
GROQ_API_KEY=gsk_your_key_here
TAVILY_API_KEY=tvly_your_key_here
MODEL=llama-3.3-70b-versatile
```

### 4. Run

```bash
npm start
```

---

## 📁 Project Structure

```
├── index.js              # Entry point, initializes agents
├── agents/
│   ├── manager.js        # Orchestrator — breaks query, delegates
│   ├── researcher.js     # Calls Tavily, returns structured findings
│   └── writer.js         # Writes final report from research data
├── tools/
│   └── tavily.js         # Tavily Search API wrapper
├── .env                  # API keys (never commit this)
└── package.json
```

---

## 📄 Output Format

Every report includes:

- **Overview** — summary of findings
- **Key Findings** — bullet points
- **Comparison / Analysis** — side-by-side if applicable
- **Pros & Cons** — for each option
- **Recommendation** — based on data only
- **Sources** — all URLs cited

---

## � How to Use

When you run `npm start`, the system will prompt you to enter your research query:

```
🔍 Enter your research query: Compare Stripe vs Razorpay for a SaaS startup in Pakistan
```

Type any research topic and press Enter — the agents will handle the rest.

---

## 🛠️ Troubleshooting

| Error | Fix |
|-------|-----|
| `GROQ_API_KEY not found` | Check `.env` file exists and key is set |
| `organization_restricted` | Create a new Groq account with a different email |
| `413 token limit` | Already handled — findings are trimmed automatically |
| `Tavily search failed` | Check your Tavily API key and internet connection |

this is separate project and cli-agentic-assistance is separate project
