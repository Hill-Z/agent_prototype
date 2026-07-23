import type { EvaluationResult } from '../guardrail/guardrail.types';

export type RuntimeStepKind = 'analysis' | 'guardrail' | 'skill' | 'knowledge' | 'tool' | 'generation' | 'vision' | 'asr';

export type RuntimeAttachmentKind = 'image' | 'audio';
export type RuntimeChannel = 'udesk_im' | 'web' | 'whatsapp' | 'x_dm';

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

export interface RuntimePlanStep {
  id: string;
  title: string;
  capability: string;
  runtimeStepId: string;
}

export interface RuntimePlan {
  goal: string;
  steps: RuntimePlanStep[];
}

export interface RuntimeScenario {
  id: string;
  reply: string;
  messages?: string[];
  waitMessage?: string;
  steps: RuntimeStep[];
  plan?: RuntimePlan;
  recognition?: RecognitionResult;
}

export interface RuntimeRun {
  id: string;
  channel: RuntimeChannel;
  input: string;
  attachments: RuntimeAttachment[];
  result: EvaluationResult;
  scenario: RuntimeScenario;
  replannedFrom?: string;
  completedSteps: number;
  visibleReplyMessages: number;
  waitNoticeVisible: boolean;
  typingVisible: boolean;
  completed: boolean;
  cancelled: boolean;
  queued?: boolean;
}
