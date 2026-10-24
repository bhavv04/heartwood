"use client";

import { useEffect, useState } from "react";

type Quote = { quoteText: string; quoteAuthor: string };

const URL = "https://calandhobbes-quoter.vercel.app/api/quotes/random";

export default function FooterQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();

    fetch(URL, { signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`quote api returned ${res.status}`);
        return res.json();
      })
      .then(setQuote)
      .catch((err) => {
        if (err.name !== "AbortError") console.error(err);
      });

    return () => ctrl.abort();
  }, []);

  if (!quote) return null;

  return (
    <footer className="space-y-1 text-xs text-muted px-4">
      <p>&ldquo;{quote.quoteText}&rdquo;</p>
      <p>&mdash; {quote.quoteAuthor}</p>
    </footer>
  );
}
