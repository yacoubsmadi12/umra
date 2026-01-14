import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

type CreateRequestInput = z.infer<typeof api.requests.create.input>;
type UpdateRequestInput = z.infer<typeof api.requests.update.input>;

export function useMyRequest() {
  return useQuery({
    queryKey: [api.requests.myRequest.path],
    queryFn: async () => {
      const res = await fetch(api.requests.myRequest.path);
      if (!res.ok) throw new Error("Failed to fetch request");
      return api.requests.myRequest.responses[200].parse(await res.json());
    },
  });
}

export function useAllRequests() {
  return useQuery({
    queryKey: [api.requests.list.path],
    queryFn: async () => {
      const res = await fetch(api.requests.list.path);
      if (!res.ok) throw new Error("Failed to fetch requests");
      return api.requests.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateRequestInput) => {
      const res = await fetch(api.requests.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create request");
      return api.requests.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.myRequest.path] });
      toast({
        title: "تم إرسال الطلب",
        description: "سيتم مراجعة طلبك من قبل المشرفين",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateRequestInput }) => {
      const url = buildUrl(api.requests.update.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update request");
      return api.requests.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.myRequest.path] });
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      toast({
        title: "تم تحديث الطلب",
        description: "تم حفظ التغييرات بنجاح",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: error.message,
      });
    },
  });
}
