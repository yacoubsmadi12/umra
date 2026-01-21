import { 
  Users, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  ShieldCheck, 
  Download, 
  Trash2, 
  ExternalLink,
  Phone,
  MessageCircle,
  Contact2
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, type UmrahRequest, type User, type EmailSettings, type TripContact } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmailSettingsSchema } from "@shared/schema";

function EmailSettingsForm({ settings }: { settings: EmailSettings | null }) {
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(insertEmailSettingsSchema),
    defaultValues: settings || {
      host: "",
      port: 587,
      user: "",
      password: "",
      fromEmail: "",
      competitionLink: ""
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      return await apiRequest("POST", api.email.updateSettings.path, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.email.getSettings.path] });
      toast({ title: "تم الحفظ", description: "تم تحديث إعدادات البريد الإلكتروني" });
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="host"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SMTP Host</FormLabel>
                <FormControl><Input {...field} placeholder="smtp.gmail.com" /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="port"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Port</FormLabel>
                <FormControl><Input {...field} type="number" onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="user"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User / Email</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl><Input {...field} type="password" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fromEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>From Email</FormLabel>
              <FormControl><Input {...field} placeholder="no-reply@zain.com" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="competitionLink"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رابط المسابقات (اختياري)</FormLabel>
              <FormControl><Input {...field} placeholder="https://..." /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={mutation.isPending} className="w-full">
          {mutation.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </form>
    </Form>
  );
}

function ContactManagementForm({ type, contact }: { type: string, contact?: TripContact }) {
  const { toast } = useToast();
  const titles: Record<string, string> = {
    leader: "أمير الرحلة",
    admin: "الإداري",
    doctor: "طبيب الرحلة"
  };

  const form = useForm({
    defaultValues: contact || {
      name: "",
      phone: "",
      whatsapp: "",
      order: type === 'leader' ? 1 : type === 'admin' ? 2 : 3
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: any) => {
      return await apiRequest("POST", "/api/trip-contacts", { ...values, type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trip-contacts"] });
      toast({ title: "تم التحديث", description: `تم تحديث معلومات ${titles[type]}` });
    }
  });

  return (
    <Card className="p-4 border-primary/10">
      <h3 className="font-bold text-primary mb-4 text-right">{titles[type]}</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-3">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="w-full text-right block">الاسم</FormLabel>
                <FormControl><Input {...field} className="text-right" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="w-full text-right block">رقم الهاتف</FormLabel>
                <FormControl><Input {...field} dir="ltr" /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="w-full text-right block">رقم الواتساب (مع رمز الدولة)</FormLabel>
                <FormControl><Input {...field} dir="ltr" placeholder="962790000000" /></FormControl>
              </FormItem>
            )}
          />
          <Button type="submit" disabled={mutation.isPending} className="w-full" size="sm">
            حفظ
          </Button>
        </form>
      </Form>
    </Card>
  );
}

export default function Admin() {
  const { toast } = useToast();
  const { data: requests, isLoading: loadingReqs } = useQuery<(UmrahRequest & { user: User })[]>({ 
    queryKey: [api.requests.list.path] 
  });
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({ 
    queryKey: ["/api/users"] 
  });
  const { data: emailSettings } = useQuery<EmailSettings>({ 
    queryKey: [api.email.getSettings.path] 
  });
  const { data: contacts } = useQuery<TripContact[]>({ 
    queryKey: ["/api/trip-contacts"] 
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, comments }: { id: number, status: string, comments?: string }) => {
      return await apiRequest("PATCH", `/api/requests/${id}`, { status, adminComments: comments });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.requests.list.path] });
      toast({ title: "تم التحديث", description: "تم تغيير حالة الطلب بنجاح" });
    }
  });

  if (loadingReqs || loadingUsers) {
    return <div className="flex items-center justify-center min-h-screen"><Clock className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 pb-20 font-tajawal">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-primary">لوحة التحكم الإدارية</h1>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-lg py-1 px-4">{users?.length} موظف</Badge>
          <Badge variant="outline" className="text-lg py-1 px-4">{requests?.length} طلب</Badge>
        </div>
      </div>

      <Tabs defaultValue="requests" dir="rtl" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="requests" className="text-lg">طلبات العمرة</TabsTrigger>
          <TabsTrigger value="users" className="text-lg">الموظفين</TabsTrigger>
          <TabsTrigger value="contacts" className="text-lg">فريق الرحلة</TabsTrigger>
          <TabsTrigger value="email" className="text-lg">الإعدادات</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>طلبات التسجيل</CardTitle>
              <CardDescription>إدارة ومراجعة طلبات الموظفين لبرنامج العمرة</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ الطلب</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests?.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="text-right">
                        <div className="font-bold">{req.user.fullName}</div>
                        <div className="text-xs text-muted-foreground">{req.user.employeeId} - {req.user.department}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                          {req.status === 'approved' ? 'مقبول' : req.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        {new Date(req.createdAt || '').toLocaleDateString('ar-JO')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => updateStatus.mutate({ id: req.id, status: 'approved' })}
                          >
                            موافقة
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              const comments = window.prompt("سبب الرفض:");
                              if (comments !== null) updateStatus.mutate({ id: req.id, status: 'rejected', comments });
                            }}
                          >
                            رفض
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>الموظفين المسجلين</CardTitle>
              <CardDescription>قائمة بجميع الموظفين الذين لديهم حسابات في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الرقم الوظيفي</TableHead>
                    <TableHead className="text-right">القسم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-right font-medium">{u.fullName}</TableCell>
                      <TableCell className="text-right">{u.employeeId}</TableCell>
                      <TableCell className="text-right">{u.department}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{u.role === 'admin' ? 'مدير' : 'موظف'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contacts" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['leader', 'admin', 'doctor'].map(type => (
              <ContactManagementForm 
                key={type} 
                type={type} 
                contact={contacts?.find(c => c.type === type)} 
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>إعدادات البريد الإلكتروني</CardTitle>
                <CardDescription>تكوين خادم SMTP لإرسال الإشعارات والمسابقات</CardDescription>
              </CardHeader>
              <CardContent>
                <EmailSettingsForm settings={emailSettings || null} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>معلومات النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p className="text-sm text-muted-foreground">يتم استخدام هذه الإعدادات لإرسال إشعارات تغيير حالة الطلبات، ورابط المسابقة الرمضانية.</p>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <ShieldCheck className="w-5 h-5" />
                  بياناتك محمية ومشفرة
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
