"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

type DrawerProps = {
  labelledBy: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Side panel on a native modal <dialog>. The browser makes the rest of the
 * page inert (the focus trap), closes on Escape and restores focus on close.
 */
export function Drawer({ labelledBy, onClose, children }: DrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // A layout effect, because close() can only restore focus while the dialog
  // is still in the document.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  function handleNativeClose() {
    // Strict Mode's simulated remount reopens the dialog before the close
    // event from its cleanup arrives, so only a dialog still shut is a close.
    if (!dialogRef.current?.open) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onClose={handleNativeClose}
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-none w-full max-w-md border-l border-slate-200 bg-white shadow-2xl backdrop:bg-slate-900/40 motion-safe:animate-drawer-in motion-safe:backdrop:animate-fade-in"
    >
      <div className="h-full overflow-y-auto">{children}</div>
    </dialog>
  );
}
