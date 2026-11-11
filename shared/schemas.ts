import { z } from 'zod';

export const MAX_TURN_CHARS = 2000;
export const MAX_TURNS = 40;

export const LANGS = ['en', 'es'] as const;
export const LangSchema = z.enum(LANGS);
export type Lang = z.infer<typeof LangSchema>;

export const BLOCKAGE_KEYS = [
  'past_tense',
  'vocabulary',
  'short_answers',
  'agreement',
  'word_order',
  'questions',
] as const;
export const BlockageKeySchema = z.enum(BLOCKAGE_KEYS);
export type BlockageKey = z.infer<typeof BlockageKeySchema>;

export const TurnSchema = z.object({
  role: z.enum(['user', 'character']),
  characterId: z.string().min(1).max(32),
  text: z.string().max(MAX_TURN_CHARS),
  at: z.number().int().nonnegative(),
});
export type Turn = z.infer<typeof TurnSchema>;

export const ChatRequestSchema = z.object({
  lang: LangSchema,
  characterId: z.string().min(1).max(32),
  turns: z.array(TurnSchema).max(MAX_TURNS),
  remainingSec: z.number().int().min(0).max(600).optional(),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({ reply: z.string().min(1).max(MAX_TURN_CHARS) });
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

export const BlockageSchema = z.object({
  key: BlockageKeySchema,
  observation: z.string().min(1).max(300),
  said: z.string().min(1).max(MAX_TURN_CHARS).optional(),
  corrected: z.string().min(1).max(MAX_TURN_CHARS).optional(),
  occurrences: z.number().int().min(1).max(MAX_TURNS),
  severity: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});
export type Blockage = z.infer<typeof BlockageSchema>;

export const DiagnoseRequestSchema = z.object({
  lang: LangSchema,
  turns: z.array(TurnSchema).max(MAX_TURNS),
});
export type DiagnoseRequest = z.infer<typeof DiagnoseRequestSchema>;

/** Sortie brute attendue du modèle (avant filtrage). */
export const DiagnoseModelOutputSchema = z.object({ blockages: z.array(BlockageSchema).max(6) });

export const DiagnoseResponseSchema = z.object({ blockages: z.array(BlockageSchema).max(3) });
export type DiagnoseResponse = z.infer<typeof DiagnoseResponseSchema>;
