/* Run a Claude Code agent over this repo from a script, so the work bills to
   ANTHROPIC_API_KEY (and so to API credit) rather than to a Claude Code plan.

     cd tools && npm install
     export ANTHROPIC_API_KEY=sk-ant-...
     node tools/agent.mjs "audit js/rules.js against the halachos quoted in js/content.js"
     node tools/agent.mjs --write "add a jsdoc comment to every export in js/rules.js"

   Read-only unless --write is passed. AGENT_MODEL picks the model (default
   opus); AGENT_BUDGET_USD stops the run at an estimated spend (default 5). */
import { query } from '@anthropic-ai/claude-agent-sdk';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2);
const write = args.includes('--write');
const prompt = args.filter(a => a !== '--write').join(' ');
if (!prompt) { console.error('usage: node tools/agent.mjs [--write] "task"'); process.exit(1); }
if (!process.env.ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY is not set'); process.exit(1); }

for await (const m of query({
  prompt,
  options: {
    cwd: resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    model: process.env.AGENT_MODEL ?? 'opus',
    allowedTools: write ? ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'Bash'] : ['Read', 'Glob', 'Grep'],
    permissionMode: write ? 'acceptEdits' : 'default',
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    maxBudgetUsd: Number(process.env.AGENT_BUDGET_USD ?? 5),
  },
})) {
  if (m.type === 'assistant') {
    for (const b of m.message?.content ?? []) {
      if ('text' in b) process.stdout.write(b.text);
      else if ('name' in b) console.log(`\n· ${b.name}`);
    }
  } else if (m.type === 'result') {
    console.log(`\n\n[${m.subtype}] spent $${(m.total_cost_usd ?? 0).toFixed(4)}`);
  }
}
