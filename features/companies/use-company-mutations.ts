"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyKeys, createCompany, updateCompany } from "@/lib/api/companies";
import { isApiStatus } from "@/lib/api/http";
import type { UpdateCompanyBody } from "@/lib/api/schema";

// Cache upkeep lives here so it runs even if the drawer closes mid-request.
// UI reactions belong in the callbacks passed to mutate().

export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
  });
}

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateCompanyBody) => updateCompany(id, body),
    onSuccess: async (updated) => {
      const detailKey = companyKeys.detail(id);
      // A read that started before this write must not overwrite its result.
      await queryClient.cancelQueries({ queryKey: detailKey });
      queryClient.setQueryData(detailKey, updated);
      void queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
    },
    onError: (error) => {
      // Nothing was written, so there is nothing to roll back, but the 409
      // proves that what the cache holds for this record is out of date.
      if (isApiStatus(error, 409)) {
        void queryClient.invalidateQueries({ queryKey: companyKeys.all });
      }
    },
  });
}
