export const ROLE_LABEL = { local_resident: 'Local Resident', tourist: 'Tourist' };
export const CATEGORY_LABEL = {
  environmental_protection: 'Environmental Protection',
  beach_cleanup: 'Beach Cleanup',
  marine_conservation: 'Marine Conservation',
  surfing: 'Surfing',
  responsible_tourism: 'Responsible Tourism',
  community_service: 'Community Service',
  local_culture: 'Local Culture',
  exploration: 'Exploration',
};
export const CATEGORY_ICON = {
  environmental_protection: '🌿', beach_cleanup: '🧹', marine_conservation: '🐢', surfing: '🏄',
  responsible_tourism: '🧭', community_service: '🤝', local_culture: '🏘️', exploration: '🗺️',
};
export const objectiveDone = (m, o) => (m.progress?.[o.id]?.count ?? 0) >= o.count;
export const missionDone = (m) => m.status === 'active' && m.objectives.every((o) => objectiveDone(m, o));
export const cleanColor = (v) => (v >= 85 ? '#2e8b57' : v >= 70 ? '#ffd166' : v >= 55 ? '#ff9f43' : '#e63946');

export const TIPS = [
  'A plastic bottle can last 450 years in the ocean. Pick it up!',
  'Never stand on coral — it is a living animal.',
  'Bring a reusable water bottle on island-hopping trips.',
  'Keep at least 3 meters away from sea turtles.',
  'Buy local: it keeps tourism money in Siargao communities.',
  'Leave No Trace: carry out everything you carry in.',
  'Reef-safe sunscreen protects tidal pool creatures.',
];

/** Which NPC hands out a mission: its first talk objective, or the destination's first NPC. */
export function missionGiver(m, layout) {
  const talk = m.objectives.find((o) => o.type === 'talk_npc');
  return talk?.target || layout?.npcs?.[0]?.key;
}
