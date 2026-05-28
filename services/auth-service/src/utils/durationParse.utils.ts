/**
 * Parse a duration string (e.g. '15m', '1h', '7d', '30s') to seconds.
 */
export const parseDurationToSeconds = (duration: string): number => {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // default 15 min
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      return 900;
  }
};
