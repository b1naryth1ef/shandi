export function formatPercentage(value: number): string {
  return Number(value).toLocaleString(undefined, {
    style: "percent",
    minimumFractionDigits: 0,
  });
}

export function formatDamage(value: number): string {
  if (value > 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value > 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value > 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return `${value}`;
}

export function formatDuration(dur: number): string {
  const date = new Date(0);
  date.setSeconds(dur);
  return date.toISOString().substring(14, 19);
}

export function sanitizeDescription(data: string): string {
  return data.replace(new RegExp("<.*>(.*)</.*>"), "$1");
}
