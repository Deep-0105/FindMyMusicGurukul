const SKILL_ICON_MAP = {
  'guitar': '🎸',
  'keyboard': '🎹',
  'piano': '🎹',
  'vocal': '🎤',
  'vocals': '🎤',
  'harmonium': '🪗',
  'tabla': '🥁',
  'drums': '🥁',
  'drum': '🥁',
  'violin': '🎻',
  'flute': '🪈',
  'indian classical': '🎼',
  'western music': '🎵'
};

export const getSkillIcon = (skill) => {
  if (!skill) return '🎵';

  let dbIcon = null;
  let name = '';
  let slug = '';

  if (typeof skill === 'object') {
    dbIcon = skill.icon;
    name = skill.name || '';
    slug = skill.slug || '';
  } else if (typeof skill === 'string') {
    name = skill;
  }

  if (dbIcon && dbIcon !== '?' && dbIcon !== '??' && dbIcon.trim() !== '') {
    return dbIcon;
  }

  const key = (name || slug || '').toLowerCase();
  for (const [k, icon] of Object.entries(SKILL_ICON_MAP)) {
    if (key.includes(k)) return icon;
  }

  return '🎵';
};

export default getSkillIcon;
