import { useAuth } from "@/hooks/use-auth";
import { useAllRequests, useUpdateRequest } from "@/hooks/use-requests";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
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

import * as XLSX from "xlsx";

export default function AdminDashboard() {
  const { data: requests, isLoading } = useAllRequests();
  const { mutate: updateRequest } = useUpdateRequest();
  const [rejectReason, setRejectReason] = useState("");
  const [selectedColleagues, setSelectedColleagues] = useState<number[]>([]);
  const [isColleaguesDialogOpen, setIsColleaguesDialogOpen] = useState(false);
  const [colleaguesRequest, setColleaguesRequest] = useState<any>(null);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");

  useEffect(() => {
    const handleTabChange = (e: any) => {
      const tab = e.detail;
      if (tab === "المقبولين بالعمرة الماضية") {
        setActiveTab("past_accepted");
      } else if (tab === "فيد الانتظار") {
        setActiveTab("pending");
      } else if (tab === "المقبولة") {
        setActiveTab("approved");
      } else if (tab === "المرفوضة") {
        setActiveTab("rejected");
      } else if (tab === "المسجلون") {
        setActiveTab("registered");
      } else {
        setActiveTab("all");
      }
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

  const { data: pastParticipants } = useQuery<any[]>({
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

  const [csvPreview, setCsvPreview] = useState<any[] | null>(null);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      
      const headers = data[0] as string[];
      const rows = data.slice(1) as any[][];

      const getIdx = (name: string) => headers.findIndex(h => h && h.toString().includes(name));

      const empIdIdx = getIdx("الرقم الوظيفي") !== -1 ? getIdx("الرقم الوظيفي") : getIdx("employeeId");
      const nameIdx = getIdx("الاسم") !== -1 ? getIdx("الاسم") : getIdx("fullName");
      const expIdx = getIdx("عدد سنوات الخبره") !== -1 ? getIdx("عدد سنوات الخبره") : getIdx("yearsOfExperience");
      const contractIdx = getIdx("نوع العقد") !== -1 ? getIdx("نوع العقد") : getIdx("contractType");
      const dateIdx = getIdx("تاريخ اخر عمره") !== -1 ? getIdx("تاريخ اخر عمره") : getIdx("lastUmrahDate");

      const mapped = rows.map(row => ({
        employeeId: row[empIdIdx]?.toString() || "",
        fullName: row[nameIdx]?.toString() || "",
        yearsOfExperience: parseInt(row[expIdx]?.toString() || "0"),
        contractType: row[contractIdx]?.toString() || "",
        lastUmrahDate: row[dateIdx]?.toString() || ""
      })).filter(p => p.employeeId);

      setCsvPreview(mapped);
    };
    reader.readAsBinaryString(file);
  };

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
    fromEmail: "",
    competitionLink: ""
  });

  useEffect(() => {
    if (emailSettings && typeof emailSettings === 'object') {
      const settings = emailSettings as any;
      setSmtpForm({
        host: settings.host || "",
        port: settings.port || 587,
        user: settings.user || "",
        password: settings.password || "",
        fromEmail: settings.fromEmail || "",
        competitionLink: settings.competitionLink || ""
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
  };

  const handleFileUpload = (id: number, type: 'visa' | 'ticket', url: string) => {
    updateRequest({ id, data: type === 'visa' ? { visaUrl: url } : { ticketUrl: url } });
  };

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
                    <DialogDescription>
                      تكوين إعدادات خادم البريد (SMTP) ورابط المسابقة النشطة.
                    </DialogDescription>
                  </DialogHeader>
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
                            <Label>Competition Link / رابط المسابقة</Label>
                            <Input 
                              value={smtpForm.competitionLink} 
                              onChange={e => setSmtpForm({...smtpForm, competitionLink: e.target.value})}
                              placeholder="https://forms.gle/..."
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
            <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1">
              <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
              <TabsTrigger value="approved">المقبولة</TabsTrigger>
              <TabsTrigger value="rejected">المرفوضة</TabsTrigger>
              <TabsTrigger value="registered">المسجلون</TabsTrigger>
              <TabsTrigger value="past_accepted" className="gap-2">
                <Users className="w-4 h-4" /> المقبولين سابقاً
              </TabsTrigger>
            </TabsList>
            <div className="mt-6">
              <TabsContent value="pending"><RequestList filterStatus="pending" /></TabsContent>
              <TabsContent value="approved"><RequestList filterStatus="approved" /></TabsContent>
              <TabsContent value="rejected"><RequestList filterStatus="rejected" /></TabsContent>
              <TabsContent value="past_accepted">
                <Card className="p-8 border-primary/20 shadow-lg bg-white">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold font-tajawal">إدارة المقبولين في العمرة السابقة</h2>
                          <p className="text-muted-foreground">عرض وتحديث قائمة الموظفين المستثنيين من القرعة تلقائياً</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        {pastParticipants && pastParticipants.length > 0 && (
                          <Button variant="outline" className="hover-elevate" onClick={() => {
                            const csv = "الرقم الوظيفي,الاسم,عدد سنوات الخبره,نوع العقد,تاريخ اخر عمره تم قبوله بها\n" + 
                              pastParticipants.map(p => `${p.employeeId},${p.fullName},${p.yearsOfExperience},${p.contractType},${p.lastUmrahDate}`).join("\n");
                            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                            const link = document.createElement("a");
                            link.href = URL.createObjectURL(blob);
                            link.download = "past_participants.csv";
                            link.click();
                          }}>تصدير البيانات (CSV)</Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="font-bold gap-2">
                              <Upload className="w-4 h-4" /> تحديث القائمة
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>تحديث قائمة المقبولين</DialogTitle>
                              <DialogDescription>ارفع ملف Excel أو CSV جديد لتحديث بيانات الاستثناءات</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 py-4 font-tajawal">
                              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-sm space-y-2">
                                <p className="font-bold text-primary">إرشادات الملف:</p>
                                <p>يجب أن يحتوي الملف على أعمدة: الرقم الوظيفي، الاسم، سنوات الخبرة، نوع العقد، وتاريخ العمرة.</p>
                              </div>
                              <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-2xl p-8 hover:bg-primary/[0.02] transition-colors bg-muted/10">
                                {csvPreview ? (
                                  <div className="w-full space-y-4">
                                    <div className="bg-white p-4 rounded-xl border border-primary/10 max-h-48 overflow-y-auto">
                                      <h5 className="font-bold text-sm mb-2 flex items-center gap-2">
                                        <Check className="w-4 h-4 text-green-500" /> معاينة ({csvPreview.length} موظف)
                                      </h5>
                                      <table className="w-full text-[10px] text-right">
                                        <thead><tr className="border-b"><th>الرقم الوظيفي</th><th>الاسم</th></tr></thead>
                                        <tbody>
                                          {csvPreview.slice(0, 5).map((p, i) => (
                                            <tr key={i} className="border-b last:border-0"><td className="py-1">{p.employeeId}</td><td className="py-1">{p.fullName}</td></tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button variant="outline" className="flex-1" onClick={() => setCsvPreview(null)}>إلغاء</Button>
                                      <Button className="flex-1 font-bold" onClick={() => { uploadPastMutation.mutate(csvPreview); setCsvPreview(null); }}>تأكيد الرفع</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <Upload className="w-12 h-12 text-primary/40 mb-4" />
                                    <Button variant="default" size="lg" className="w-full font-bold shadow-lg" asChild>
                                      <label className="cursor-pointer">
                                        اختر الملف الآن
                                        <input type="file" className="hidden" accept=".csv, .xlsx, .xls" onChange={handleCsvUpload} />
                                      </label>
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-primary/10 overflow-hidden shadow-sm">
                      <div className="bg-primary/5 p-4 text-sm font-bold grid grid-cols-4 text-center border-b">
                        <span>الرقم الوظيفي</span>
                        <span>اسم الموظف</span>
                        <span>نوع العقد</span>
                        <span>تاريخ آخر عمرة</span>
                      </div>
                      <div className="max-h-[500px] overflow-y-auto divide-y">
                        {pastParticipants && pastParticipants.length > 0 ? (
                          pastParticipants.map((p, i) => (
                            <div key={i} className="grid grid-cols-4 text-sm p-4 text-center hover:bg-primary/[0.02] transition-colors">
                              <span className="font-mono text-primary font-medium">{p.employeeId}</span>
                              <span className="font-bold">{p.fullName}</span>
                              <span>{p.contractType}</span>
                              <Badge variant="outline" className="mx-auto">{p.lastUmrahDate}</Badge>
                            </div>
                          ))
                        ) : (
                          <div className="py-20 text-center text-muted-foreground">لا توجد بيانات مسجلة حالياً</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
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
                          <div className="p-4 bg-primary/[0.03] rounded-xl text-sm whitespace-pre-wrap border border-primary/10 min-h-[160px] leading-relaxed shadow-sm">
                            {req.passportData ? (
                              <div className="space-y-2">
                                {req.passportData.split('\n').map((line: string, i: number) => {
                                  const [label, ...valueParts] = line.split(':');
                                  const value = valueParts.join(':').trim();
                                  if (!label || !value) return <div key={i}>{line}</div>;
                                  return (
                                    <div key={i} className="flex justify-between items-center border-b border-primary/5 pb-1 last:border-0">
                                      <span className="font-bold text-primary/70">{label}:</span>
                                      <span className="text-foreground font-medium">{value}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : "لم يتم استخراج البيانات بعد"}
                          </div>
                          {req.passportUrl && (
                            <Button variant="ghost" size="sm" className="w-full text-xs hover:bg-primary/5" onClick={() => window.open(req.passportUrl!, '_blank')}>
                              <Download className="w-3 h-3 ml-1" /> عرض الجواز المرفق
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" /> بيانات المرافق 1
                          </Label>
                          <div className="p-4 bg-primary/[0.03] rounded-xl text-sm whitespace-pre-wrap border border-primary/10 min-h-[160px] leading-relaxed shadow-sm">
                            {req.companion1PassportData ? (
                              <div className="space-y-2">
                                {req.companion1PassportData.split('\n').map((line: string, i: number) => {
                                  const [label, ...valueParts] = line.split(':');
                                  const value = valueParts.join(':').trim();
                                  if (!label || !value) return <div key={i}>{line}</div>;
                                  return (
                                    <div key={i} className="flex justify-between items-center border-b border-primary/5 pb-1 last:border-0">
                                      <span className="font-bold text-primary/70">{label}:</span>
                                      <span className="text-foreground font-medium">{value}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (req.needsCompanion ? "لم يتم استخراج البيانات" : "لا يوجد مرافق")}
                          </div>
                          {req.companion1PassportUrl && (
                            <Button variant="ghost" size="sm" className="w-full text-xs hover:bg-primary/5" onClick={() => window.open(req.companion1PassportUrl!, '_blank')}>
                              <Download className="w-3 h-3 ml-1" /> عرض الجواز المرفق
                            </Button>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                            <Users className="w-4 h-4" /> بيانات المرافق 2
                          </Label>
                          <div className="p-4 bg-primary/[0.03] rounded-xl text-sm whitespace-pre-wrap border border-primary/10 min-h-[160px] leading-relaxed shadow-sm">
                            {req.companion2PassportData ? (
                              <div className="space-y-2">
                                {req.companion2PassportData.split('\n').map((line: string, i: number) => {
                                  const [label, ...valueParts] = line.split(':');
                                  const value = valueParts.join(':').trim();
                                  if (!label || !value) return <div key={i}>{line}</div>;
                                  return (
                                    <div key={i} className="flex justify-between items-center border-b border-primary/5 pb-1 last:border-0">
                                      <span className="font-bold text-primary/70">{label}:</span>
                                      <span className="text-foreground font-medium">{value}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (req.needsCompanion ? "لم يتم استخراج البيانات" : "لا يوجد مرافق")}
                          </div>
                          {req.companion2PassportUrl && (
                            <Button variant="ghost" size="sm" className="w-full text-xs hover:bg-primary/5" onClick={() => window.open(req.companion2PassportUrl!, '_blank')}>
                              <Download className="w-3 h-3 ml-1" /> عرض الجواز المرفق
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
