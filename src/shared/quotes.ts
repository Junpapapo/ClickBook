export interface Quote {
  text: string;
  author?: string;
}

export const QUOTES: Quote[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Keep your face always toward the sunshine - and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "Nothing is impossible. The word itself says 'I'm possible!'", author: "Audrey Hepburn" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Opportunities don't happen. You create them.", author: "Chris Grosser" },
  { text: "Hardships often prepare ordinary people for an extraordinary destiny.", author: "C.S. Lewis" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
  { text: "It is never too late to be what you might have been.", author: "George Eliot" },
  { text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi" },
  { text: "Your time is limited, so don't waste it living someone else's life.", author: "Steve Jobs" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
  { text: "Success seems to be connected with action. Successful people keep moving.", author: "Conrad Hilton" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "Aim for the moon. If you miss, you may hit a star.", author: "W. Clement Stone" },
  { text: "Don't decrease the goal. Increase the effort.", author: "Unknown" },
  { text: "Productivity is being able to do things that you were never able to do before.", author: "Franz Kafka" },
  { text: "If you cannot do great things, do small things in a great way.", author: "Napoleon Hill" },
  { text: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins" },
  { text: "Concentrate all your thoughts upon the work at hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
  { text: "Organizing is what you do before you do something, so that when you do it, it is not all mixed up.", author: "A. A. Milne" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
  { text: "Tomorrow is often the busiest day of the week.", author: "Spanish Proverb" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "Either you run the day or the day runs you.", author: "Jim Rohn" },
  { text: "Great things are done by a series of small things brought together.", author: "Vincent Van Gogh" },
  { text: "You don't need to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg" },
  { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
  { text: "There is no substitute for hard work.", author: "Thomas Edison" },
  { text: "It is not that I am so smart, it's just that I stay with problems longer.", author: "Albert Einstein" },
  { text: "Make each day your masterpiece.", author: "John Wooden" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "Your mind is for having ideas, not holding them.", author: "David Allen" },
  { text: "Be not afraid of going slowly, be afraid only of standing still.", author: "Chinese Proverb" },
  { text: "The master has failed more times than the beginner has even tried.", author: "Stephen McCranie" },
  { text: "Well begun is half done.", author: "Aristotle" },
  { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
  { text: "The secret of change is to focus all of your energy, not on fighting the old, but on building the new.", author: "Socrates" }
];

export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[index];
}
