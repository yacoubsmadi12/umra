import { useAuth } from "@/hooks/use-auth";
import { useAllRequests, useUpdateRequest } from "@/hooks/use-requests";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Check, X, Upload, FileText, Mail, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminDashboard() {
  const { data: requests, isLoading } = useAllRequests();
  const { mutate: updateRequest } = useUpdateRequest();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedColleagues, setSelectedColleagues] = useState<number[]>([]);
  const { toast } = useToast();

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.json();
    }
  });

  const { data: emailSettings, isLoading: isLoadingEmail } = useQuery({
    queryKey: [api.email.getSettings.path],
  });

  const updateEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest(api.email.updateSettings.method, api.email.updateSettings.path, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.email.getSettings.path] });
      toast({ title: "تم التحديث", description: "تم حفظ إعدادات البريد الإلكتروني بنجاح" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "خطأ", description: "فشل في حفظ الإعدادات" });
    }
  });

  const [smtpForm, setSmtpForm] = useState({
    host: "",
    port: 587,
    user: "",
    password: "",
    fromEmail: ""
  });

  useEffect(() => {
    if (emailSettings) {
      setSmtpForm({
        host: emailSettings.host,
        port: emailSettings.port,
        user: emailSettings.user,
        password: emailSettings.password,
        fromEmail: emailSettings.fromEmail
      });
    }
  }, [emailSettings]);

  if (isLoading) {
    return (
      <ProtectedRoute requireAdmin>
        <Layout isAdmin>
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  const handleStatusUpdate = (id: number, status: 'approved' | 'rejected', comments?: string) => {
    updateRequest({ id, data: { status, adminComments: comments } });
    setSelectedRequest(null);
    setRejectReason("");
  };

  const handleFileUpload = (id: number, type: 'visa' | 'ticket', url: string) => {
    updateRequest({ id, data: type === 'visa' ? { visaUrl: url } : { ticketUrl: url } });
  };

  const EmailSettingsForm = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          إعدادات خادم البريد (SMTP)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => {
          e.preventDefault();
          updateEmailMutation.mutate(smtpForm);
        }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Host / الخادم</Label>
              <Input 
                value={smtpForm.host} 
                onChange={e => setSmtpForm({...smtpForm, host: e.target.value})}
                placeholder="smtp.example.com" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Port / المنفذ</Label>
              <Input 
                type="number"
                value={smtpForm.port} 
                onChange={e => setSmtpForm({...smtpForm, port: parseInt(e.target.value)})}
                placeholder="587" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Username / اسم المستخدم</Label>
              <Input 
                value={smtpForm.user} 
                onChange={e => setSmtpForm({...smtpForm, user: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password / كلمة المرور</Label>
              <Input 
                type="password"
                value={smtpForm.password} 
                onChange={e => setSmtpForm({...smtpForm, password: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>From Email / البريد المرسل</Label>
              <Input 
                type="email"
                value={smtpForm.fromEmail} 
                onChange={e => setSmtpForm({...smtpForm, fromEmail: e.target.value})}
                placeholder="no-reply@zain.com"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={updateEmailMutation.isPending}>
            {updateEmailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "حفظ الإعدادات"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const RequestList = ({ filterStatus }: { filterStatus: string }) => {
    const filtered = requests?.filter(r => filterStatus === 'all' || r.status === filterStatus);

    if (!filtered?.length) return <p className="text-center text-muted-foreground py-10">لا توجد طلبات</p>;

    return (
      <div className="grid gap-4">
        {filtered.map((req) => (
          <Card key={req.id} className="p-6 border-l-4 border-l-primary flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{req.user.fullName}</h3>
                <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {req.status === 'pending' && 'جديد'}
                  {req.status === 'approved' && 'مقبول'}
                  {req.status === 'rejected' && 'مرفوض'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{req.user.department} - {req.user.jobTitle}</p>
              <p className="text-sm text-muted-foreground">رقم الموظف: {req.user.employeeId}</p>
              
              {req.status === 'approved' && (
                <div className="pt-2 flex gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold">الدفع:</span> 
                    {req.paymentMethod ? req.paymentMethod : "لم يحدد"}
                  </span>
                  {req.passportUrl && (
                    <a href={req.passportUrl} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      جواز السفر
                    </a>
                  )}
                </div>
              )}

              {req.needsCompanion && (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {req.companion1Name && (
                    <div className="p-2 rounded bg-muted/50 text-xs flex justify-between items-center border">
                      <span className="font-semibold">المرافق 1: {req.companion1Name}</span>
                      {req.companion1PassportUrl && (
                        <a href={req.companion1PassportUrl} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-1">
                          <FileText className="w-3 h-3" /> جواز السفر
                        </a>
                      )}
                    </div>
                  )}
                  {req.companion2Name && (
                    <div className="p-2 rounded bg-muted/50 text-xs flex justify-between items-center border">
                      <span className="font-semibold">المرافق 2: {req.companion2Name}</span>
                      {req.companion2PassportUrl && (
                        <a href={req.companion2PassportUrl} target="_blank" rel="noreferrer" className="text-primary underline flex items-center gap-1">
                          <FileText className="w-3 h-3" /> جواز السفر
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 justify-center min-w-[200px]">
              {req.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleStatusUpdate(req.id, 'approved')} 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" /> قبول
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <X className="w-4 h-4 mr-2" /> رفض
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>رفض الطلب</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>سبب الرفض</Label>
                          <Textarea 
                            value={rejectReason} 
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="اكتب سبب الرفض هنا..." 
                          />
                        </div>
                        <Button 
                          variant="destructive" 
                          onClick={() => handleStatusUpdate(req.id, 'rejected', rejectReason)}
                          className="w-full"
                        >
                          تأكيد الرفض
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {req.status === 'approved' && (
                <div className="grid grid-cols-2 gap-2">
                  <ObjectUploader
                     onGetUploadParameters={async (file) => {
                       const res = await fetch("/api/uploads/request-url", {
                         method: "POST", headers: {"Content-Type": "application/json"},
                         body: JSON.stringify({name: file.name, size: file.size, contentType: file.type})
                       });
                       const { uploadURL } = await res.json();
                       return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                     }}
                     onComplete={(res) => {
                       if (res.successful?.[0]) handleFileUpload(req.id, 'visa', res.successful[0].uploadURL);
                     }}
                  >
                     <div className="w-full">
                       <Button variant="outline" size="sm" className="w-full text-xs" disabled={!!req.visaUrl}>
                         <Upload className="w-3 h-3 mr-1" /> {req.visaUrl ? 'تم رفع التأشيرة' : 'رفع التأشيرة'}
                       </Button>
                     </div>
                  </ObjectUploader>

                  <ObjectUploader
                     onGetUploadParameters={async (file) => {
                       const res = await fetch("/api/uploads/request-url", {
                         method: "POST", headers: {"Content-Type": "application/json"},
                         body: JSON.stringify({name: file.name, size: file.size, contentType: file.type})
                       });
                       const { uploadURL } = await res.json();
                       return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                     }}
                     onComplete={(res) => {
                       if (res.successful?.[0]) handleFileUpload(req.id, 'ticket', res.successful[0].uploadURL);
                     }}
                  >
                     <div className="w-full">
                       <Button variant="outline" size="sm" className="w-full text-xs" disabled={!!req.ticketUrl}>
                         <Upload className="w-3 h-3 mr-1" /> {req.ticketUrl ? 'تم رفع التذكرة' : 'رفع التذكرة'}
                       </Button>
                     </div>
                  </ObjectUploader>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full text-xs mt-2 col-span-2" onClick={() => {
                        setSelectedColleagues(req.assignedColleagueIds || []);
                      }}>
                        <Users className="w-3 h-3 mr-1" /> تعيين زملاء ({req.assignedColleagueIds?.length || 0})
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>تعيين زملاء الرحلة لـ {req.user.fullName}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        {users?.filter(u => u.role === 'employee' && u.id !== req.userId).map(u => (
                          <div key={u.id} className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-muted rounded-lg border">
                            <Checkbox 
                              id={`user-${u.id}`} 
                              checked={selectedColleagues.includes(u.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedColleagues([...selectedColleagues, u.id]);
                                } else {
                                  setSelectedColleagues(selectedColleagues.filter(id => id !== u.id));
                                }
                              }}
                            />
                            <label htmlFor={`user-${u.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                              {u.fullName} - {u.department}
                            </label>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full" onClick={() => {
                        updateRequest({ id: req.id, data: { assignedColleagueIds: selectedColleagues } });
                        toast({ title: "تم الحفظ", description: "تم تعيين الزملاء بنجاح" });
                      }}>حفظ التعديلات</Button>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <ProtectedRoute requireAdmin>
      <Layout isAdmin>
        <div className="space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-tajawal text-primary">لوحة تحكم المشرف</h1>
            <Badge variant="outline" className="text-lg px-4 py-1">
              {requests?.length} طلبات
            </Badge>
          </header>

          <Tabs defaultValue="pending" className="w-full">
            <TabsList className="w-full grid grid-cols-5 lg:w-[500px]">
              <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
              <TabsTrigger value="approved">المقبولة</TabsTrigger>
              <TabsTrigger value="rejected">المرفوضة</TabsTrigger>
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="pending"><RequestList filterStatus="pending" /></TabsContent>
              <TabsContent value="approved"><RequestList filterStatus="approved" /></TabsContent>
              <TabsContent value="rejected"><RequestList filterStatus="rejected" /></TabsContent>
              <TabsContent value="all"><RequestList filterStatus="all" /></TabsContent>
              <TabsContent value="settings"><EmailSettingsForm /></TabsContent>
            </div>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
