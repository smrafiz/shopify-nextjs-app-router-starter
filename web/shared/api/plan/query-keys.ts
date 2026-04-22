export const planKeys = {
  all: ["plan"] as const,
  current: () => [...planKeys.all, "current"] as const,
};
