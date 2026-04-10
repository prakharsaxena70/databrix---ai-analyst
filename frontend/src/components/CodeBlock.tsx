"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CodeBlockProps {
  code: string;
}

export default function CodeBlock({ code }: CodeBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-3 rounded-xl border border-border/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50/80 hover:bg-slate-100/80 transition-colors text-sm font-medium text-muted-foreground"
      >
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
          Generated Code
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="relative">
          <pre className="p-4 bg-slate-950 text-slate-100 text-sm overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="absolute top-2 right-2 h-8 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
