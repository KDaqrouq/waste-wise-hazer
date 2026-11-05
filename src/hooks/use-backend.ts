import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Shared queries so every component reads the same cached backend state.
export const backendKeys = {
  health: ["health"] as const,
  stats: ["stats"] as const,
  history: ["history"] as const,
};

export const useHealth = () =>
  useQuery({ queryKey: backendKeys.health, queryFn: api.health, retry: false, refetchInterval: 30_000 });

export const useStats = () => useQuery({ queryKey: backendKeys.stats, queryFn: api.stats, retry: false });

export const useHistory = (limit = 6) =>
  useQuery({ queryKey: [...backendKeys.history, limit], queryFn: () => api.history(limit), retry: false });
