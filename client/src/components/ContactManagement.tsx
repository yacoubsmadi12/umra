import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ContactInfo } from "@shared/schema";
import { Phone, MessageCircle, User } from "lucide-react";

interface ContactFormProps {
  type: 'leader' | 'admin' | 'doctor';
  label: string;
  existing?: ContactInfo;
}

function ContactForm({ type, label, existing }: ContactFormProps) {
  const { toast } = useToast();
  const form = useForm({
    defaultValues: {
      name: existing?.name || "",
      phone: existing?.phone || "",
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const res = await apiRequest("POST", "/api/contact-info", { ...data, type });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact-info"] });
      toast({ title: "تم التحديث بنجاح" });
    }
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="grid gap-2">
            <Label>الاسم</Label>
            <Input {...form.register("name")} placeholder="اسم المشرف" />
          </div>
          <div className="grid gap-2">
            <Label>رقم الهاتف</Label>
            <Input {...form.register("phone")} placeholder="079xxxxxxx" />
          </div>
          <Button type="submit" disabled={mutation.isPending} className="w-full">
            حفظ
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function ContactManagement() {
  const { data: contacts } = useQuery<ContactInfo[]>({
    queryKey: ["/api/contact-info"]
  });

  const leader = contacts?.find(c => c.type === 'leader');
  const admin = contacts?.find(c => c.type === 'admin');
  const doctor = contacts?.find(c => c.type === 'doctor');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">معلومات الاتصال بفريق زين</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ContactForm type="leader" label="أمير الرحلة" existing={leader} />
        <ContactForm type="admin" label="الإداري" existing={admin} />
        <ContactForm type="doctor" label="طبيب الرحلة" existing={doctor} />
      </div>
    </div>
  );
}
