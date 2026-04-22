"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppBridge } from "@shopify/app-bridge-react";
import { uploadMediaAction, deleteMediaAction } from "@/shared/actions";
import { mediaKeys } from "./query-keys";

export function useUploadMedia() {
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const token = await shopify.idToken();
      const result = await uploadMediaAction(token, file);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.uploads() });
    },
  });
}

export function useDeleteMedia() {
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      const token = await shopify.idToken();
      const result = await deleteMediaAction(token, mediaId);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.uploads() });
    },
  });
}
