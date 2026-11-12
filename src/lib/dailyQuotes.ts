export interface Quote { text: string; author: string }
export const DAILY_QUOTES: Quote[] = [
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Until the lion learns to write, tales of the hunt will glorify the hunter.", author: "Chinua Achebe" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Education is the passport to the future.", author: "Malcolm X" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Unknown" },
  { text: "If you are working on something exciting, it will keep you motivated.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
  { text: "A smooth sea never made a skilled sailor.", author: "Franklin D. Roosevelt" },
  { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "When the music changes, so does the dance.", author: "African proverb" },
  { text: "However long the night, the dawn will break.", author: "African proverb" },
  { text: "Your score today is not your limit. Practise, review, rise.", author: "Edura" },
  { text: "Don't just practise. Know what to do next.", author: "Edura" },
];
/** Same quote all day (Lagos time), a new one tomorrow. */
export function quoteForDate(date: Date, quotes: Quote[] = DAILY_QUOTES): Quote {
  const day = Math.floor((date.getTime() + 3600_000) / 86_400_000);
  return quotes[((day % quotes.length) + quotes.length) % quotes.length];
}
