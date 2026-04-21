import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "../actions";
import { announcementKeys } from "./announcement-keys";
import { CreateAnnouncementInput, UpdateAnnouncementInput } from "../types";

export function useCreateAnnouncement() {
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAnnouncementInput) => {
      const token = await shopify.idToken();
      const result = await createAnnouncementAction(token, input);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useUpdateAnnouncement() {
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateAnnouncementInput }) => {
      const token = await shopify.idToken();
      const result = await updateAnnouncementAction(token, id, input);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}

export function useDeleteAnnouncement() {
  const shopify = useAppBridge();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const token = await shopify.idToken();
      const result = await deleteAnnouncementAction(token, id);
      if (result.status === "error") throw new Error(result.message);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementKeys.lists() });
    },
  });
}
