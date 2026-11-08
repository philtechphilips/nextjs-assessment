import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-slate-900 text-white hover:bg-slate-700",
  secondary: "border border-slate-300 bg-white hover:bg-slate-100",
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANTS;
  /**
   * Ignores activation but, unlike `disabled`, keeps the button focusable, so
   * a keyboard user does not lose their place when it stops being available.
   */
  isInactive?: boolean;
};

export function Button({
  variant = "secondary",
  type = "button",
  className = "",
  isInactive = false,
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-disabled={isInactive}
      onClick={(event) => {
        if (isInactive) event.preventDefault();
        else onClick?.(event);
      }}
      className={`rounded px-3 py-1.5 text-sm font-medium aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
