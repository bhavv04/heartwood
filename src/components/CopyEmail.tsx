"use client";

import { useState } from "react";
import { FiCheck, FiMail } from "react-icons/fi";
import Tip from "./Tip";

export default function CopyEmail({
  email,
  className,
}: {
  email: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Tip text={copied ? "Copied!" : "click to copy bhavdeepsa@gmail.com"}>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Email copied" : "Copy my email"}
        className={className}
      >
        {copied ? <FiCheck size={18} /> : <FiMail size={18} />}
      </button>
    </Tip>
  );
}