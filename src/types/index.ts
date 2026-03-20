export interface Book {
  id: string | number;
  title: string;
  author: string;
  narrator?: string;
  coverUrl: string;
  audioUrl?: string;
  duration?: string;
  description?: string;
  category?: string;
  bookmarkTimestamp?: number; // timestamp in milliseconds
  bookmarkPos?: number; // position in microseconds
}
