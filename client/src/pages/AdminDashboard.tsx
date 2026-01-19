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
import { Loader2, Check, X, Upload, FileText, Mail, Users, Download } from "lucide-react";
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
  const [isColleaguesDialogOpen, setIsColleaguesDialogOpen] = useState(false);
  const [colleaguesRequest, setColleaguesRequest] = useState<any>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    const handleTabChange = (e: any) => {
      setActiveTab(e.detail);
    };
    window.addEventListener('admin-tab-change', handleTabChange);
    return () => window.removeEventListener('admin-tab-change', handleTabChange);
  }, []);

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      return res.json();
    }
  });

  const { data: emailSettings } = useQuery({
    queryKey: [api.email.getSettings.path],
  });

  const { data: pastParticipants, isLoading: isLoadingPast } = useQuery<any[]>({
    queryKey: ["/api/past-participants"],
  });

  const uploadPastMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const res = await apiRequest("POST", "/api/past-participants", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/past-participants"] });
      toast({ title: "تم الرفع", description: "تم تحديث قائمة المقبولين السابقين بنجاح" });
    }
  });

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    import("papaparse").then((Papa) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const mapped = results.data.map((row: any) => ({
            employeeId: row["الرقم الوظيفي"] || row["employeeId"],
            fullName: row["الاسم"] || row["fullName"],
            yearsOfExperience: parseInt(row["عدد سنوات الخبره"] || row["yearsOfExperience"] || "0"),
            contractType: row["نوع العقد"] || row["contractType"],
            lastUmrahDate: row["تاريخ اخر عمره تم قبوله بها"] || row["lastUmrahDate"]
          }));
          uploadPastMutation.mutate(mapped);
        }
      });
    });
  };

  const PastParticipantsView = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>استيراد المقبولين السابقين</CardTitle>
          <div className="flex items-center gap-2">
            <Input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" id="csv-upload" />
            <Button asChild variant="outline">
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" /> ارفاق ملف CSV/Excel
              </label>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            يجب أن يحتوي الملف على الأعمدة التالية: الرقم الوظيفي، الاسم، عدد سنوات الخبره، نوع العقد، تاريخ اخر عمره تم قبوله بها.
          </p>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-right">الرقم الوظيفي</th>
                  <th className="p-2 text-right">الاسم</th>
                  <th className="p-2 text-right">الخبرة</th>
                  <th className="p-2 text-right">نوع العقد</th>
                  <th className="p-2 text-right">آخر عمرة</th>
                </tr>
              </thead>
              <tbody>
                {pastParticipants?.map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.employeeId}</td>
                    <td className="p-2">{p.fullName}</td>
                    <td className="p-2">{p.yearsOfExperience} سنة</td>
                    <td className="p-2">{p.contractType}</td>
                    <td className="p-2">{p.lastUmrahDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
    if (emailSettings && typeof emailSettings === 'object') {
      const settings = emailSettings as any;
      setSmtpForm({
        host: settings.host || "",
        port: settings.port || 587,
        user: settings.user || "",
        password: settings.password || "",
        fromEmail: settings.fromEmail || ""
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
          <Card key={req.id || `req-${req.id}`} className="p-6 border-l-4 border-l-primary flex flex-col md:flex-row justify-between gap-6">
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
                    <div className="w-full">
                      <ObjectUploader
                        onComplete={(res) => {
                          handleFileUpload(req.id, 'visa', res.url);
                        }}
                      >
                         <Button variant="outline" size="sm" className="w-full text-xs" disabled={!!req.visaUrl}>
                           <Upload className="w-3 h-3 mr-1" /> {req.visaUrl ? 'تم رفع التأشيرة' : 'رفع التأشيرة'}
                         </Button>
                      </ObjectUploader>
                    </div>

                    <div className="w-full">
                      <ObjectUploader
                        onComplete={(res) => {
                          handleFileUpload(req.id, 'ticket', res.url);
                        }}
                      >
                         <Button variant="outline" size="sm" className="w-full text-xs" disabled={!!req.ticketUrl}>
                           <Upload className="w-3 h-3 mr-1" /> {req.ticketUrl ? 'تم رفع التذكرة' : 'رفع التذكرة'}
                         </Button>
                      </ObjectUploader>
                    </div>

                  <Button variant="outline" size="sm" className="w-full text-xs mt-2 col-span-2" onClick={() => {
                    setColleaguesRequest(req);
                    setSelectedColleagues(req.assignedColleagueIds || []);
                    setIsColleaguesDialogOpen(true);
                  }}>
                    <Users className="w-3 h-3 mr-1" /> تعيين زملاء ({req.assignedColleagueIds?.length || 0})
                  </Button>
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
            <div className="flex items-center gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Mail className="w-4 h-4" /> إعدادات البريد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>إعدادات البريد الإلكتروني</DialogTitle>
                  </DialogHeader>
                  <EmailSettingsForm />
                </DialogContent>
              </Dialog>
              <Badge variant="outline" className="text-lg px-4 py-1">
                {requests?.length} طلبات
              </Badge>
            </div>
          </header>

          <Dialog open={isColleaguesDialogOpen} onOpenChange={setIsColleaguesDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>تعيين زملاء الرحلة لـ {colleaguesRequest?.user.fullName}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                {Array.isArray(users) ? (
                  users.filter((u: any) => u.role === 'employee' && u.id !== colleaguesRequest?.userId).map((u: any) => (
                    <div key={`colleague-list-${u.id}`} className="flex items-center space-x-2 space-x-reverse p-2 hover:bg-muted rounded-lg border">
                      <Checkbox 
                        id={`colleague-chk-${u.id}`} 
                        checked={selectedColleagues.includes(u.id)}
                        onCheckedChange={(checked) => {
                          const id = u.id;
                          if (checked) {
                            setSelectedColleagues(prev => prev.includes(id) ? prev : [...prev, id]);
                          } else {
                            setSelectedColleagues(prev => prev.filter(item => item !== id));
                          }
                        }}
                      />
                      <label htmlFor={`colleague-chk-${u.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                        {u.fullName} - {u.department}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center p-4">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button className="w-full" onClick={() => {
                if (colleaguesRequest) {
                  updateRequest({ id: colleaguesRequest.id, data: { assignedColleagueIds: selectedColleagues.map(id => Number(id)) } });
                  toast({ title: "تم الحفظ", description: "تم تعيين الزملاء بنجاح" });
                  setIsColleaguesDialogOpen(false);
                }
              }}>حفظ التعديلات</Button>
            </DialogContent>
          </Dialog>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="mt-6">
              <TabsContent value="pending"><RequestList filterStatus="pending" /></TabsContent>
              <TabsContent value="approved"><RequestList filterStatus="approved" /></TabsContent>
              <TabsContent value="rejected"><RequestList filterStatus="rejected" /></TabsContent>
              <TabsContent value="registered">
                <div className="grid gap-6">
                  {requests?.filter(r => r.status === 'approved' || r.status === 'pending').map(req => (
                    <Card key={req.id} className="p-8 border-primary/20 shadow-md">
                      <div className="flex items-center justify-between mb-6 border-b pb-4">
                        <h3 className="font-bold text-xl text-primary font-tajawal">{req.user.fullName}</h3>
                        <Badge variant={req.status === 'approved' ? 'default' : 'secondary'}>
                          {req.status === 'approved' ? 'مقبول' : 'قيد الانتظار'}
                        </Badge>
                      </div>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4" /> بيانات صاحب الطلب
                          </Label>
                          <div className="p-4 bg-primary/5 rounded-xl text-sm whitespace-pre-wrap border border-primary/10 min-h-[150px] leading-relaxed">
                            {req.passportData || "لم يتم استخراج البيانات بعد"}
                          </div>
                          {req.passportUrl && (
                            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => window.open(req.passportUrl!, '_blank')}>
                              <Download className="w-3 h-3 ml-1" /> عرض الجواز المرفق
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" /> بيانات المرافق 1
                          </Label>
                          <div className="p-4 bg-primary/5 rounded-xl text-sm whitespace-pre-wrap border border-primary/10 min-h-[150px] leading-relaxed">
                            {req.companion1PassportData || (req.needsCompanion ? "لم يتم استخراج البيانات" : "لا يوجد مرافق")}
                          </div>
                          {req.companion1PassportUrl && (
                            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => window.open(req.companion1PassportUrl!, '_blank')}>
                              <Download className="w-3 h-3 ml-1" /> عرض الجواز المرفق
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" /> بيانات المرافق 2
                          </Label>
                          <div className="p-4 bg-primary/5 rounded-xl text-sm whitespace-pre-wrap border border-primary/10 min-h-[150px] leading-relaxed">
                            {req.companion2PassportData || (req.needsCompanion && req.companion2Name ? "لم يتم استخراج البيانات" : "لا يوجد مرافق")}
                          </div>
                          {req.companion2PassportUrl && (
                            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => window.open(req.companion2PassportUrl!, '_blank')}>
                              <Download className="w-3 h-3 ml-1" /> عرض الجواز المرفق
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="all"><RequestList filterStatus="all" /></TabsContent>
              <TabsContent value="past"><PastParticipantsView /></TabsContent>
              <TabsContent value="settings"><EmailSettingsForm /></TabsContent>
            </div>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
