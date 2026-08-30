const WORDS_PER_MINUTE = 200;

/** Estimate reading time from raw markdown/MDX body text. */
export function getReadingTime(rawContent: string): string {
  const words = rawContent
    .replace(/```[\s\S]*?```/g, "") // strip fenced code blocks
    .split(/\s+/)
    .filter(Boolean).length;

  const minutes = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}

export function formatDate(date: Date): string {
  return new Date(date.toISOString()).toLocaleDateString(navigator.language, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
