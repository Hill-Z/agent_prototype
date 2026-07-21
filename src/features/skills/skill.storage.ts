import { defaultSkills, type ManagedSkill } from './skill.types';

const KEY = 'uagent-managed-skills-v1';
export function loadManagedSkills(): ManagedSkill[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? structuredClone(defaultSkills); }
  catch { return structuredClone(defaultSkills); }
}
export const persistManagedSkills = (skills: ManagedSkill[]) => localStorage.setItem(KEY, JSON.stringify(skills));
