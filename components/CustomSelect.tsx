"use client";

import { useState, useRef, useEffect } from "react";

export interface Option {
  value: string | number;
  label: string;
}

interface Props {
  options: Option[];
  value: string | number;
  onChange: (value: any) => void;
  label?: string;
  className?: string;
}

export default function CustomSelect({ options, value, onChange, label, className = "" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="mb-1 block text-sm font-medium">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[42px] w-full items-center justify-between rounded border border-border bg-bg-light px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <span className="truncate">{selectedOption?.label ?? value}</span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-bg-light py-1 shadow-lg ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`flex w-full items-center px-4 py-2.5 text-left text-[14px] transition-colors hover:bg-bg-dark/5 ${
                opt.value === value ? "bg-bg-dark/5 font-semibold text-accent" : "text-bg-dark"
              }`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
