export function createQueryKeys(feature: string) {
  return {
    all: [feature] as const,
    lists: () => [feature, "list"] as const,
    detail: (id: string) => [feature, "detail", id] as const,
    infinite: () => [feature, "infinite"] as const,
  };
}
