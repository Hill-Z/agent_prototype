import type { EvaluationResult } from '../guardrail/guardrail.types';

export type RuntimeStepKind = 'analysis' | 'guardrail' | 'skill' | 'knowledge' | 'tool' | 'generation';

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
}

export interface RuntimeRun {
  id: string;
  input: string;
  result: EvaluationResult;
  scenario: RuntimeScenario;
  completedSteps: number;
  typingVisible: boolean;
  completed: boolean;
}
