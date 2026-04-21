import { useAnnouncementsQuery } from "../api/announcement-queries";
import { useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement } from "../api/announcement-mutations";
import { useAnnouncementStore } from "../stores";

export function useAnnouncements() {
  const { data: announcements = [], isLoading, error } = useAnnouncementsQuery();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const { isFormOpen, selectedId, openForm, closeForm } = useAnnouncementStore();

  const selectedAnnouncement = announcements.find((a) => a.id === selectedId) ?? null;

  return {
    announcements,
    isLoading,
    error,
    isFormOpen,
    selectedAnnouncement,
    openForm,
    closeForm,
    create: createMutation.mutateAsync,
    update: (id: string, input: Parameters<typeof updateMutation.mutateAsync>[0]["input"]) =>
      updateMutation.mutateAsync({ id, input }),
    remove: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
