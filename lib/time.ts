export function formatRelativeTime(isoTimestamp?: string) {
  if (!isoTimestamp) {
    return 'Updated just now';
  }

  const updated = new Date(isoTimestamp);
  if (Number.isNaN(updated.getTime())) {
    return 'Updated just now';
  }

  const diff = Date.now() - updated.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return 'Updated just now';
  }

  if (minutes < 60) {
    return `Updated ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Updated ${days} day${days === 1 ? '' : 's'} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 4) {
    return `Updated ${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Updated ${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(days / 365);
  return `Updated ${years} year${years === 1 ? '' : 's'} ago`;
}
