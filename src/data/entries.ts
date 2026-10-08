export type EntryData = {
  name: string;
  line: string;
  href: string;
};

export const projects: EntryData[] = [
  {
    name: "Thunderhead",
    line: "Reverse proxy that detects bots by scoring request intent, with no CAPTCHAs.",
    href: "https://getthunderhead.vercel.app/",
  },
  {
    name: "Groat",
    line: "Self-hosted LLM proxy that cuts API costs with semantic caching and model routing.",
    href: "https://getgroat.vercel.app/",
  },
  {
    name: "Funes",
    line: "Local-first tool for querying your files, notes and shell history in plain English.",
    href: "https://getfunes.vercel.app/",
  },
  {
    name: "Gaia",
    line: "Predicting how ecological failures cascade across systems.",
    href: "https://github.com/bhavv04/gaia",
  },
  {
    name: "Wattson",
    line: "GPU kernel tuner that optimizes for power efficiency, not just speed.",
    href: "https://github.com/bhavv04/wattson",
  },
  {
    name: "Solace",
    line: "Wildfire spread simulator validated against the 2016 Fort McMurray fire.",
    href: "https://github.com/bhavv04/solace",
  },
  {
    name: "creduce",
    line: "MapReduce engine built from scratch in C, without Hadoop.",
    href: "https://github.com/bhavv04/creduce",
  },
  {
    name: "Custom Redis",
    line: "Redis-compatible in-memory key-value store written in C.",
    href: "https://github.com/bhavv04/redis",
  },
  {
    name: "awk-rs",
    line: "AWK rewritten in Rust with memory safety in mind.",
    href: "https://github.com/bhavv04/awk-rs",
  },
  {
    name: "Calvin & Hobbes API",
    line: "Philosophy from a six-year-old, on demand",
    href: "https://calandhobbes-quoter.vercel.app/",
  },

];

export const research: EntryData[] = [
  {
    name: "Precursor",
    line: "Does commodity momentum predict sector equity returns? A Granger causality study.",
    href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7151398",
  },
  {
    name: "Deadzones",
    line: "Forty years of Gulf of Mexico hypoxia, traced to Midwest agricultural runoff.",
    href: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=7186418",
  },
  {
    name: "Lacunae",
    line: "Reconstructing MRI scans from 25% of k-space with a U-Net.",
    href: "https://github.com/bhavv04/lacunae",
  },
  {
    name: "Grokking",
    line: "Reproducing delayed generalization in a small transformer.",
    href: "https://gist.github.com/bhavv04/6389c05c23e9093a91c5cf63466ece7c",
  },
  {
    name: "Quantum Drug Binding",
    line: "Predicting drug binding affinity from quantum chemical descriptors.",
    href: "https://github.com/bhavv04/quantum-drug-binding",
  },
];