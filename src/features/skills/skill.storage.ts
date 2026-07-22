import { defaultSkills, type ManagedSkill } from './skill.types';
import { inferSkillTools } from '../tools/tool.storage';

const KEY = 'uagent-managed-skills-v1';
const migratePrototypeSkill = (skill: ManagedSkill): ManagedSkill => {
  if (skill.id !== 'skill-account-update') return skill;

  const template = defaultSkills.find(item => item.id === skill.id);
  const templateFiles = template?.versions.find(version => version.version === template.currentVersion)?.files ?? [];
  const toolFile = templateFiles.find(file => file.path === 'scripts/tool.py');
  const toolDeclaration = '\n## Tools\n- Read the profile with `get_customer_update_profile(account_no, language)`.\n- Submit changes with `submit_account_update(account_no, update_type, new_value, language)`.\n';

  return {
    ...skill,
    versions: skill.versions.map(version => {
      const hasToolFile = version.files.some(file => file.path === 'scripts/tool.py');
      return {
        ...version,
        files: version.files
          .map(file => file.path === 'SKILL.md' && !file.content.includes('get_customer_update_profile(')
            ? { ...file, content: `${file.content.trimEnd()}\n${toolDeclaration}` }
            : file)
          .concat(!hasToolFile && toolFile ? [{ ...toolFile }] : [])
      };
    })
  };
};

const normalize = (skills: ManagedSkill[]) => skills.map(savedSkill => {
  const skill = migratePrototypeSkill(savedSkill);
  const declaredTools = inferSkillTools(skill);
  const toolBindings = (skill.toolBindings ?? []).map(binding => ({ ...binding, enabled: binding.enabled ?? true, timeoutSeconds: binding.timeoutSeconds ?? 30, toolId: binding.toolId.startsWith('tool-') && declaredTools[0] ? declaredTools[0].id : binding.toolId }));
  return { ...skill, declaredTools, toolBindings };
});
export function loadManagedSkills(): ManagedSkill[] {
  try { const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null'); return normalize(Array.isArray(saved) ? saved : structuredClone(defaultSkills)); }
  catch { return normalize(structuredClone(defaultSkills)); }
}
export const persistManagedSkills = (skills: ManagedSkill[]) => localStorage.setItem(KEY, JSON.stringify(skills));
