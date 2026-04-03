import { fileURLToPath } from 'node:url';
import path from 'node:path';

export interface Orchestrator {
  id: string;
  label: string;
  templateDir: string;
  destDir: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const orchestrators: Orchestrator[] = [
  {
    id: 'claude-code',
    label: 'Claude Code',
    templateDir: path.resolve(__dirname, '../../templates/agents/claude-code'),
    destDir: '.claude',
  },
  {
    id: 'github-copilot',
    label: 'GitHub Copilot (VS Code)',
    templateDir: path.resolve(__dirname, '../../templates/agents/github-copilot'),
    destDir: '.github',
  },
  {
    id: 'gemini-cli',
    label: 'Gemini CLI',
    templateDir: path.resolve(__dirname, '../../templates/agents/gemini-cli'),
    destDir: '.gemini',
  },
];
