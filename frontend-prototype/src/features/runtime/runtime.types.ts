import type { EvaluationResult } from '../guardrail/guardrail.types';

export type RuntimeStepKind = 'analysis' | 'guardrail' | 'skill' | 'knowledge' | 'tool' | 'generation' | 'vision' | 'asr';

export type RuntimeAttachmentKind = 'image' | 'audio';

export interface RuntimeAttachment {
  id: string;
  kind: RuntimeAttachmentKind;
  name: string;
  size: number;
  previewUrl?: string;
}

export interface RecognitionResult {
  title: string;
  summary: string;
  detailLabel: string;
  detail: string;
  meta: string[];
}

export interface RuntimeStep {
  id: string;
  kind: RuntimeStepKind;
  title: string;
  detail: string;
  durationMs: number;
}

export interface RuntimeScenario {
  id: string;
  reply: string;
  steps: RuntimeStep[];
  recognition?: RecognitionResult;
}

export interface RuntimeRun {
  id: string;
  input: string;
  attachments: RuntimeAttachment[];
  result: EvaluationResult;
  scenario: RuntimeScenario;
  completedSteps: number;
  typingVisible: boolean;
  completed: boolean;
}
