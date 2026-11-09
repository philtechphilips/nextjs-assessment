"use client";

import { useEffect, useId, useRef, useState } from "react";
import { SearchIcon } from "@/components/icons";

const DEBOUNCE_MS = 300;

type SearchBoxProps = {
  label: string;
  /** The search term in the URL. */
  value: string;
  onChange: (value: string) => void;
};

export function SearchBox({ label, value, onChange }: SearchBoxProps) {
  const id = useId();
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // The URL can change without typing (back button, "clear filters"). Adjusted
  // during render so the input never shows the old term for a frame.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(next: string) {
    setText(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), DEBOUNCE_MS);
  }

  return (
    <div className="relative min-w-56 grow basis-64">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
        <SearchIcon />
      </span>
      <input
        id={id}
        type="search"
        placeholder={label}
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        className="control pl-9"
      />
    </div>
  );
}
