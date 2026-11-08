"use client";

import { useEffect, useId, useRef, useState } from "react";

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
    <div className="flex grow flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        className="w-full rounded border border-slate-300 px-3 py-1.5"
      />
    </div>
  );
}
