export type ToolMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
export type ToolFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface ToolField {
  id: string;
  name: string;
  type: ToolFieldType;
  required: boolean;
}

export interface GlobalTool {
  id: string;
  name: string;
  key: string;
  description: string;
  method: ToolMethod;
  endpoint: string;
  enabled: boolean;
  inputFields: ToolField[];
  outputFields: ToolField[];
  updatedAt: string;
}

export interface SkillToolDeclaration {
  id: string;
  name: string;
  key: string;
  description: string;
  sourcePath: string;
  entrypoint: string;
  inputFields: ToolField[];
  outputFields: ToolField[];
}

export type ToolFallbackAction = 'failure_message' | 'handoff' | 'agent_reply';

export interface SkillToolBinding {
  id: string;
  toolId: string;
  enabled: boolean;
  timeoutSeconds: number;
  fallbackAction: ToolFallbackAction;
  startMessage: string;
  runningMessage: string;
  progressAfterSeconds: number;
  progressMessage: string;
  successMessage: string;
  failureMessage: string;
}
