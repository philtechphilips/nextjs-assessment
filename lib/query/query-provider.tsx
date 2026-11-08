"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { expireSession } from "@/lib/auth/session";
import { createQueryClient } from "./client";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient(expireSession));
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
