import { useAuth } from "@/hooks/use-auth";
import { useMyRequest, useUpdateRequest } from "@/hooks/use-requests";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Upload, 
  Download, 
  CreditCard, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  Phone, 
  MessageCircle,
  Heart,
  Timer,
  Trophy,
  Contact2
} from "lucide-react";
import { Redirect, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";

function ContactCard({ type, name, phone, whatsapp }: { type: string, name: string, phone: string, whatsapp: string }) {
  const titles: Record<string, string> = {
    leader: "أمير الرحلة",
    admin: "الإداري",
    doctor: "طبيب الرحلة"
  };

  return (
    <Card className="p-4 border-primary/10 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <Contact2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-primary">{titles[type] || type}</h4>
          <p className="font-medium text-foreground">{name}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">{phone}</p>
        </div>
        <div className="flex gap-2 w-full pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs gap-1 border-primary/20 hover:bg-primary/5"
            onClick={() => window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}`, '_blank')}
          >
            <MessageCircle className="w-3 h-3" />
            واتساب
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex-1 text-xs gap-1"
            onClick={() => window.open(`tel:${phone}`, '_self')}
          >
            <Phone className="w-3 h-3" />
            اتصال
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StatusCard({ status, comments }: { status: string, comments?: string | null }) {
  const config = {
    pending: { color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: Clock, label: "قيد المراجعة" },
    approved: { color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2, label: "تمت الموافقة" },
    rejected: { color: "text-red-600 bg-red-50 border-red-200", icon: XCircle, label: "مرفوض" },
  };

  const current = config[status as keyof typeof config] || config.pending;
  const Icon = current.icon;

  return (
    <div className={`p-6 rounded-2xl border ${current.color} flex flex-col items-center text-center gap-3 mb-8`}>
      <Icon className="w-12 h-12" />
      <div>
        <h3 className="font-bold text-xl mb-1">{current.label}</h3>
        <p className="text-sm opacity-80">
          {status === 'pending' && "طلبك قيد المراجعة من قبل إدارة الموارد البشرية"}
          {status === 'approved' && "مبروك! تمت الموافقة على طلبك. يمكنك الآن استكمال الإجراءات أدناه."}
          {status === 'rejected' && "نعتذر، لم يتم قبول طلبك في الوقت الحالي."}
        </p>
        {comments && (
          <div className="mt-4 p-3 bg-white/50 rounded-lg text-sm border border-black/5">
            <strong>ملاحظات المشرف:</strong> {comments}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: request, isLoading } = useMyRequest();
  const { mutate: updateRequest, isPending: isUpdating } = useUpdateRequest();
  const { data: materials } = useQuery({ queryKey: [api.materials.list.path] });
  const { data: contacts } = useQuery<any[]>({ queryKey: ["/api/trip-contacts"] });
  const { data: colleagues } = useQuery({ 
    queryKey: [api.colleagues.list.path],
    enabled: !!request?.assignedColleagueIds?.length 
  });
  const [showPayment, setShowPayment] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!request) return <Redirect to="/register" />;

  const DashboardBox = React.forwardRef(({ icon: Icon, title, onClick, disabled = false, children, ...props }: any, ref: any) => (
    <motion.div whileHover={!disabled ? { scale: 1.02 } : {}} whileTap={!disabled ? { scale: 0.98 } : {}}>
      <Card 
        ref={ref}
        className={`p-6 cursor-pointer h-full transition-all border-primary/10 hover:border-primary/30 shadow-sm hover:shadow-md ${disabled ? 'opacity-50 grayscale' : ''}`}
        onClick={(e) => {
          if (disabled) return;
          if (onClick) onClick(e);
        }}
        {...props}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-4 bg-primary/5 rounded-2xl text-primary">
            <Icon className="w-10 h-10" />
          </div>
          <h3 className="font-bold text-lg font-tajawal">{title}</h3>
          {children}
        </div>
      </Card>
    </motion.div>
  ));
  DashboardBox.displayName = "DashboardBox";

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
          <header className="flex items-center justify-between border-b pb-4">
            <h1 className="text-3xl font-bold font-tajawal text-primary">الرئيسية</h1>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-md px-4 py-1">طلب رقم #{request.id}</Badge>
            </div>
          </header>

          {request.passportUrl && (
            <StatusCard status={request.status} comments={request.adminComments} />
          )}

          {/* Approved View (When request is accepted) */}
          {request.status === 'approved' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DashboardBox 
                  icon={ShieldCheck} 
                  title="التأشيرة الإلكترونية" 
                  onClick={() => request.visaUrl && window.open(request.visaUrl, "_blank")}
                  disabled={!request.visaUrl}
                >
                  <p className="text-xs text-muted-foreground">{request.visaUrl ? "جاهزة للتحميل" : "قيد الإصدار"}</p>
                </DashboardBox>
                
                <DashboardBox 
                  icon={FileText} 
                  title="تذكرة الطيران" 
                  onClick={() => request.ticketUrl && window.open(request.ticketUrl, "_blank")}
                  disabled={!request.ticketUrl}
                >
                  <p className="text-xs text-muted-foreground">{request.ticketUrl ? "جاهزة للتحميل" : "قيد الإصدار"}</p>
                </DashboardBox>

                <Dialog>
                  <DialogTrigger asChild>
                    <DashboardBox icon={Contact2} title="معلومات فريق زين">
                      <p className="text-xs text-muted-foreground">تواصل مع فريق إدارة الرحلة</p>
                    </DashboardBox>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-primary/20 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-right text-2xl font-bold text-primary font-tajawal">فريق إدارة الرحلة</DialogTitle>
                      <DialogDescription className="text-right">فريق زين دائماً بجانبك لضمان رحلة مريحة وآمنة.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
                      {['leader', 'admin', 'doctor'].map(type => {
                        const contact = contacts?.find(c => c.type === type);
                        if (!contact) return null;
                        return (
                          <motion.div
                            key={type}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ContactCard 
                              type={type} 
                              name={contact.name} 
                              phone={contact.phone} 
                              whatsapp={contact.whatsapp} 
                            />
                          </motion.div>
                        );
                      })}
                      {(!contacts || contacts.filter(c => ['leader', 'admin', 'doctor'].includes(c.type)).length === 0) && (
                        <div className="col-span-full py-10 text-center text-muted-foreground">
                          سيتم إضافة معلومات الفريق قريباً
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <DashboardBox 
                  icon={BookOpen} 
                  title="كتيب زين للعمرة" 
                  onClick={() => window.open("https://drive.google.com/file/d/1d2kItW6Q-Ro1Buq2kfK2n59w5jcvOxCm/view?usp=sharing", "_blank")}
                >
                  <p className="text-xs text-muted-foreground">تصفح مناسك العمرة والأدعية</p>
                </DashboardBox>

                <Dialog open={showPayment} onOpenChange={setShowPayment}>
                  <DialogTrigger asChild>
                    <DashboardBox icon={CreditCard} title="طريقة الدفع">
                      <p className="text-xs text-muted-foreground">
                        {request.paymentMethod ? "تم تحديد: " + (
                          request.paymentMethod === 'salary_deduction' ? 'خصم من الراتب' :
                          request.paymentMethod === 'entertainment_allowance' ? 'خصم من بدل الترفيه' :
                          request.paymentMethod === 'cash' ? 'كاش' :
                          request.paymentMethod === 'cliQ' ? 'تحويل كليك' : request.paymentMethod
                        ) : "اختر الطريقة المناسبة"}
                      </p>
                    </DashboardBox>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-none shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-center text-xl font-bold font-tajawal">تحديد طريقة الدفع</DialogTitle>
                      <DialogDescription className="text-center">
                        اختر الطريقة التي تفضلها لتسديد تكاليف رحلة العمرة.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium pr-1">خيار الدفع</Label>
                        <Select value={request.paymentMethod || ""} onValueChange={(v) => updateRequest({ id: request.id, data: { paymentMethod: v as any } })}>
                          <SelectTrigger className="w-full h-12 bg-muted/50 border-primary/20 hover:border-primary/40 transition-colors">
                            <SelectValue placeholder="اختر الطريقة" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-slate-900 border-primary/10 shadow-xl">
                            <SelectItem value="salary_deduction" className="h-10 cursor-pointer focus:bg-primary/5">خصم من الراتب</SelectItem>
                            <SelectItem value="entertainment_allowance" className="h-10 cursor-pointer focus:bg-primary/5">خصم من بدل الترفيه</SelectItem>
                            <SelectItem value="cash" className="h-10 cursor-pointer focus:bg-primary/5">كاش</SelectItem>
                            <SelectItem value="cliQ" className="h-10 cursor-pointer focus:bg-primary/5">تحويل كليك</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button className="w-full h-12 text-lg font-bold shadow-lg hover:shadow-primary/20" onClick={() => setShowPayment(false)}>حفظ وإغلاق</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Link href="/colleagues">
                  <DashboardBox icon={Users} title="زملاء الرحلة">
                    <p className="text-xs text-muted-foreground">تعرف على زملائك في الرحلة</p>
                  </DashboardBox>
                </Link>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Box 1: Prayers (New) */}
            <Link href="/prayers">
              <DashboardBox icon={Heart} title="الأدعية 🙌">
                <p className="text-xs text-muted-foreground">تصفح مجموعة من الأدعية المختارة</p>
              </DashboardBox>
            </Link>

            {/* Box 3: Prayer Times (New) */}
            <Link href="/prayer-times">
              <DashboardBox icon={Timer} title="مواقيت الصلاة">
                <p className="text-xs text-muted-foreground">مواقيت الصلاة لليوم</p>
              </DashboardBox>
            </Link>

            {/* Box 4: Competitions (New) */}
            <Link href="/competitions">
              <DashboardBox icon={Trophy} title="المسابقات 🏆">
                <p className="text-xs text-muted-foreground">شارك واربح جوائز قيمة</p>
              </DashboardBox>
            </Link>

            {/* Box 3: Required Documents */}
            <Dialog open={showDocs} onOpenChange={setShowDocs}>
              <DialogTrigger asChild>
                <DashboardBox icon={FileText} title="المستندات المطلوبة">
                  <p className="text-xs text-muted-foreground">جواز السفر، دفتر الخدمة، والمرافقين</p>
                </DashboardBox>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>تحميل المستندات والمرافقين</DialogTitle>
                  <DialogDescription>
                    يرجى رفع صور واضحة لجواز السفر والوثائق المطلوبة لضمان سرعة معالجة طلبك.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Passport */}
                    <div className="space-y-2">
                      <Label>جواز السفر</Label>
                      {request.passportUrl ? (
                        <div className="bg-green-50 p-2 rounded border border-green-100 flex justify-between items-center">
                          <span className="text-xs text-green-700">تم الرفع</span>
                          <a href={request.passportUrl} target="_blank" className="text-primary underline text-xs">عرض</a>
                        </div>
                      ) : (
                          <div className="flex gap-2">
                            <ObjectUploader 
                              verifyPassport 
                              asChild
                              onComplete={(res) => {
                                updateRequest({ 
                                  id: request.id, 
                                  data: { 
                                    passportUrl: res.url,
                                    passportData: res.extractedData || undefined
                                  } 
                                });
                              }}
                            >
                              <div className="flex items-center justify-center cursor-pointer">
                                <Button variant="outline" size="sm" className="flex-1 text-xs">
                                  <Upload className="w-3 h-3 ml-1"/> رفع
                                </Button>
                              </div>
                            </ObjectUploader>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-xs"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.capture = 'environment';
                                input.onchange = async (e: any) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const res = await fetch("/api/uploads/local", { 
                                      method: "POST", 
                                      body: formData 
                                    });
                                    const { url } = await res.json();
                                    updateRequest({ id: request.id, data: { passportUrl: url } });
                                  }
                                };
                                input.click();
                              }}
                            >
                              تصوير
                            </Button>
                          </div>
                      )}
                    </div>
                    {/* Military Service */}
                    <div className="space-y-2">
                      <Label>دفتر خدمة العلم</Label>
                      {request.militaryServiceUrl ? (
                        <div className="bg-green-50 p-2 rounded border border-green-100 flex justify-between items-center">
                          <span className="text-xs text-green-700">تم الرفع</span>
                          <a href={request.militaryServiceUrl} target="_blank" className="text-primary underline text-xs">عرض</a>
                        </div>
                      ) : (
                        <ObjectUploader onComplete={(res) => updateRequest({ id: request.id, data: { militaryServiceUrl: res.url } })}>
                          <Button variant="outline" size="sm" className="w-full text-xs"><Upload className="w-3 h-3 ml-1"/> رفع الدفتر</Button>
                        </ObjectUploader>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <Checkbox id="needsComp" checked={request.needsCompanion || false} onCheckedChange={(c) => updateRequest({ id: request.id, data: { needsCompanion: !!c } })} />
                      <Label htmlFor="needsComp">إضافة مرافقين</Label>
                    </div>
                    {request.needsCompanion && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-muted/20 rounded-lg space-y-3">
                          <Input placeholder="اسم المرافق الأول" defaultValue={request.companion1Name || ""} onBlur={(e) => updateRequest({ id: request.id, data: { companion1Name: e.target.value } })} />
                          <div className="flex gap-2">
                            <ObjectUploader 
                              verifyPassport
                              asChild
                              onComplete={(res) => {
                                updateRequest({ 
                                  id: request.id, 
                                  data: { 
                                    companion1PassportUrl: res.url,
                                    companion1PassportData: res.extractedData || undefined
                                  } 
                                });
                              }}
                            >
                              <div className="flex items-center justify-center cursor-pointer">
                                <Button variant="outline" size="sm" className="flex-1 text-xs">
                                  {request.companion1PassportUrl ? "تم الرفع" : "رفع"}
                                </Button>
                              </div>
                            </ObjectUploader>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-xs"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.capture = 'environment';
                                input.onchange = async (e: any) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const res = await fetch("/api/uploads/local", { 
                                      method: "POST", 
                                      body: formData 
                                    });
                                    const { url } = await res.json();
                                    
                                    // Trigger verification for camera capture too
                                    const ocrRes = await fetch("/api/ai/trigger", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ type: "companion1PassportData", url })
                                    });
                                    updateRequest({ id: request.id, data: { companion1PassportUrl: url } });
                                  }
                                };
                                input.click();
                              }}
                            >
                              تصوير
                            </Button>
                          </div>
                        </div>
                        <div className="p-3 bg-muted/20 rounded-lg space-y-3">
                          <Input placeholder="اسم المرافق الثاني" defaultValue={request.companion2Name || ""} onBlur={(e) => updateRequest({ id: request.id, data: { companion2Name: e.target.value } })} />
                          <div className="flex gap-2">
                            <ObjectUploader 
                              verifyPassport
                              asChild
                              onComplete={(res) => {
                                updateRequest({ 
                                  id: request.id, 
                                  data: { 
                                    companion2PassportUrl: res.url,
                                    companion2PassportData: res.extractedData || undefined
                                  } 
                                });
                              }}
                            >
                              <div className="flex items-center justify-center cursor-pointer">
                                <Button variant="outline" size="sm" className="flex-1 text-xs">
                                  {request.companion2PassportUrl ? "تم الرفع" : "رفع"}
                                </Button>
                              </div>
                            </ObjectUploader>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 text-xs"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.capture = 'environment';
                                input.onchange = async (e: any) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    const res = await fetch("/api/uploads/local", { 
                                      method: "POST", 
                                      body: formData 
                                    });
                                    const { url } = await res.json();
                                    
                                    // Trigger verification for camera capture too
                                    const ocrRes = await fetch("/api/ai/trigger", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ type: "companion2PassportData", url })
                                    });
                                    updateRequest({ id: request.id, data: { companion2PassportUrl: url } });
                                  }
                                };
                                input.click();
                              }}
                            >
                              تصوير
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button className="w-full h-12 text-lg font-bold" onClick={() => setShowDocs(false)}>حفظ وإغلاق</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
