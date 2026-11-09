import type { ComponentProps } from "react";

const VARIANTS = {
  primary: "bg-slate-900 text-white shadow-xs not-aria-disabled:hover:bg-slate-700",
  secondary:
    "border border-slate-300 bg-white text-slate-700 shadow-xs not-aria-disabled:hover:bg-slate-50 not-aria-disabled:hover:text-slate-900",
  ghost:
    "text-slate-500 not-aria-disabled:hover:bg-slate-100 not-aria-disabled:hover:text-slate-900",
};

const SIZES = {
  sm: "h-8 px-2.5",
  md: "h-10 px-4",
  icon: "size-9",
};

type ButtonProps = ComponentProps<"button"> & {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  /**
   * Ignores activation but, unlike `disabled`, keeps the button focusable, so
   * a keyboard user does not lose their place when it stops being available.
   */
  isInactive?: boolean;
};

export function Button({
  variant = "secondary",
  size = "md",
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
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors aria-disabled:cursor-not-allowed aria-disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
