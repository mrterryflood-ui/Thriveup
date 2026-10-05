export interface SearchableNavigationItem {
  label: string;
  path: string;
  group: string;
  keywords?: string;
}

function normalize(value: string) {
  return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();
}

/** Local navigation ranking only; callers must apply authorization first. */
export function rankNavigationSearch<T extends SearchableNavigationItem>(items: T[], query: string): T[] {
  const phrase = normalize(query);
  if (!phrase) return items;
  const stopWords = new Set(["i", "need", "help", "find", "me", "with", "the", "a", "to", "for"]);
  const meaningful = phrase.split(" ").filter(word => !stopWords.has(word));
  const tokens = meaningful.length ? meaningful : phrase.split(" ");
  return items.map((item, index) => {
    const label = normalize(item.label);
    const path = normalize(item.path);
    const keywords = normalize(item.keywords ?? "");
    const group = normalize(item.group);
    const haystack = `${label} ${path} ${keywords} ${group}`;
    if (!tokens.every(token => haystack.includes(token))) return null;
    const score = (label === phrase ? 1000 : label.startsWith(phrase) ? 400 : label.includes(phrase) ? 200 : 0)
      + tokens.reduce((sum, token) => sum + (label.includes(token) ? 40 : path.includes(token) ? 20 : keywords.includes(token) ? 10 : 1), 0);
    return { item, index, score };
  }).filter((entry): entry is { item: T; index: number; score: number } => entry !== null)
    .sort((a, b) => b.score - a.score || a.index - b.index).map(entry => entry.item);
}