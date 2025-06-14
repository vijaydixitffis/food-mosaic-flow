
import { format, isValid } from 'date-fns';

export const formatDate = (dateString: string | Date | undefined | null): string => {
  if (!dateString) {
    return 'N/A';
  }
  try {
    const date = new Date(dateString);
    if (!isValid(date)) {
      return 'Invalid date';
    }
    return format(date, 'PPP'); // e.g., Jun 14, 2025
  } catch (e) {
    return 'Invalid date';
  }
};
