import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError, isApiStatus } from "@/lib/api/http";

/** Retrying a 4xx cannot change the answer; a 5xx or network failure might. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  const isClientError = error instanceof ApiError && error.status < 500;
  return failureCount < 2 && !isClientError;
}

export function createQueryClient(onUnauthorized: () => void): QueryClient {
  const handleError = (error: unknown) => {
    if (isApiStatus(error, 401)) onUnauthorized();
  };

  return new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: shouldRetry,
      },
    },
  });
}
