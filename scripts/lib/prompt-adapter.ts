import type { ClassifierAdapter } from "./types";

export function promptAdapter(version: string): ClassifierAdapter {
  throw new Error(
    `Prompt variant "${version}" is not available: the versioned-prompt layer is Stage 4b.`,
  );
}
