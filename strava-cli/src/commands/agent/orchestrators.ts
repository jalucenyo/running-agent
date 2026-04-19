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
    templateDir: path.resolve(
      __dirname,
      '../../templates/skills/sports-analyst',
    ),
    destDir: '.claude/skills/sports-analyst',
  },
  {
    id: 'github-copilot',
    label: 'GitHub Copilot (VS Code)',
    templateDir: path.resolve(
      __dirname,
      '../../templates/skills/sports-analyst',
    ),
    destDir: '.github/skills/sports-analyst',
  },
  {
    id: 'gemini-cli',
    label: 'Gemini CLI',
    templateDir: path.resolve(
      __dirname,
      '../../templates/skills/sports-analyst',
    ),
    destDir: '.gemini/skills/sports-analyst',
  },
];
