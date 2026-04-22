export const mediaKeys = {
  all: ["media"] as const,
  uploads: () => [...mediaKeys.all, "uploads"] as const,
};
