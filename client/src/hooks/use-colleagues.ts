import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function useColleagues() {
  return useQuery({
    queryKey: [api.colleagues.list.path],
    queryFn: async () => {
      const res = await fetch(api.colleagues.list.path);
      if (!res.ok) throw new Error("Failed to fetch colleagues");
      return api.colleagues.list.responses[200].parse(await res.json());
    },
  });
}
