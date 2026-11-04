const dateFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
const relFmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

export function useFormat() {
  const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : '—');
  const formatDateTime = (value) => (value ? dateTimeFmt.format(new Date(value)) : '—');

  const dueLabel = (value) => {
    if (!value) return '';
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const startOfDue = new Date(value).setHours(0, 0, 0, 0);
    const days = Math.round((startOfDue - startOfToday) / 86400000);
    return relFmt.format(days, 'day');
  };

  const initials = (name = '') =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');

  const timeAgo = (value) => {
    const seconds = Math.round((new Date(value) - Date.now()) / 1000);
    const units = [
      ['year', 31536000],
      ['month', 2592000],
      ['week', 604800],
      ['day', 86400],
      ['hour', 3600],
      ['minute', 60],
    ];
    for (const [unit, size] of units) {
      if (Math.abs(seconds) >= size) return relFmt.format(Math.round(seconds / size), unit);
    }
    return 'just now';
  };

  const toInputDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

  return { formatDate, formatDateTime, dueLabel, initials, timeAgo, toInputDate };
}
