"use client";

import { useEffect, useState } from "react";

type Quote = { quoteText: string; quoteAuthor: string };

export default function FooterQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetch("https://calandhobbes-quoter.vercel.app/api/quotes/random")
      .then((res) => res.json())
      .then(setQuote)
      .catch(console.error);
  }, []);

  if (!quote) return null;

  return (
    <footer className="footer-quote">
      <p>&ldquo;{quote.quoteText}&rdquo;</p>
      <p>&mdash; {quote.quoteAuthor}</p>
    </footer>
  );
}