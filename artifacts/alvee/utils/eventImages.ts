const imageMap: Record<string, any> = {
  evt_jazz: require("@/assets/images/evt_jazz.png"),
  evt_tech: require("@/assets/images/evt_tech.png"),
  evt_art: require("@/assets/images/evt_art.png"),
  evt_run: require("@/assets/images/evt_run.png"),
  event_hero: require("@/assets/images/event_hero.png"),
};

export function getEventImage(key?: string): any {
  if (key && imageMap[key]) return imageMap[key];
  return imageMap.event_hero;
}
