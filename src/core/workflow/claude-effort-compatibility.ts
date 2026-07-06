import type { ClaudeEffort } from '../models/workflow-types.js';

const CLAUDE_MODEL_ALIASES: ReadonlySet<string> = new Set([
  'opus',
  'sonnet',
  'haiku',
  'opusplan',
  'default',
]);

const CLAUDE_MODEL_ID_PREFIX = 'claude-';

const XHIGH_SUPPORTED_MODEL_PREFIXES: readonly string[] = [
  'claude-opus-4-7',
  'claude-opus-4-8',
  'claude-sonnet-5',
  'claude-fable-5',
];

function modelMatchesPrefix(model: string, prefix: string): boolean {
  return model === prefix || model.startsWith(`${prefix}-`);
}

export function validateClaudeEffortCompatibility(
  model: string | undefined,
  effort: ClaudeEffort | undefined,
): void {
  if (!model || !effort) return;
  if (CLAUDE_MODEL_ALIASES.has(model)) return;
  if (!model.startsWith(CLAUDE_MODEL_ID_PREFIX)) return;

  if (effort === 'xhigh') {
    const supported = XHIGH_SUPPORTED_MODEL_PREFIXES.some((prefix) =>
      modelMatchesPrefix(model, prefix),
    );
    if (!supported) {
      throw new Error(
        `Configuration error: provider_options.claude.effort 'xhigh' is not supported by model '${model}'. `
        + "'xhigh' is supported only by Opus 4.7 (claude-opus-4-7), Opus 4.8 (claude-opus-4-8), "
        + 'Sonnet 5 (claude-sonnet-5), and Fable 5 (claude-fable-5).',
      );
    }
  }
}
