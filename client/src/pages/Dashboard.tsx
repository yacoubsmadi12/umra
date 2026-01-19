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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Loader2, CheckCircle2, XCircle, Clock, Upload, Download, CreditCard, Users, BookOpen, ShieldCheck, FileText, Phone, MessageCircle } from "lucide-react";
import { Redirect, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState } from "react";

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
  const { data: colleagues } = useQuery({ queryKey: [api.colleagues.list.path] });
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
            <Badge variant="secondary" className="text-md px-4 py-1">طلب رقم #{request.id}</Badge>
          </header>

          {request.passportUrl && (
            <StatusCard status={request.status} comments={request.adminComments} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Box 1: Booklet */}
            <DashboardBox 
              icon={BookOpen} 
              title="كتيب زين للعمرة" 
              onClick={() => window.open("https://drive.google.com/file/d/1d2kItW6Q-Ro1Buq2kfK2n59w5jcvOxCm/view?usp=sharing", "_blank")}
              disabled={true}
            >
              <p className="text-xs text-muted-foreground">تصفح مناسك العمرة والأدعية</p>
            </DashboardBox>

            {/* Box 2: Payment Method */}
            <Dialog open={showPayment} onOpenChange={setShowPayment}>
              <DialogTrigger asChild>
                <DashboardBox icon={CreditCard} title="طريقة الدفع" disabled={true}>
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
                          <ObjectUploader onGetUploadParameters={async (file) => {
                            const res = await fetch("/api/uploads/request-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
                            const { uploadURL } = await res.json();
                            return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                          }} onComplete={(res) => res.successful?.[0] && updateRequest({ id: request.id, data: { passportUrl: res.successful[0].uploadURL } })}>
                            <Button variant="outline" size="sm" className="flex-1 text-xs"><Upload className="w-3 h-3 ml-1"/> رفع</Button>
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
                                  const res = await fetch("/api/uploads/request-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
                                  const { uploadURL } = await res.json();
                                  await fetch(uploadURL, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
                                  updateRequest({ id: request.id, data: { passportUrl: uploadURL.split('?')[0] } });
                                }
                              };
                              input.click();
                            }}
                          >
                            <Loader2 className="w-3 h-3 ml-1"/> تصوير
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
                        <ObjectUploader onGetUploadParameters={async (file) => {
                          const res = await fetch("/api/uploads/request-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
                          const { uploadURL } = await res.json();
                          return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                        }} onComplete={(res) => res.successful?.[0] && updateRequest({ id: request.id, data: { militaryServiceUrl: res.successful[0].uploadURL } })}>
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
                            <ObjectUploader onGetUploadParameters={async (file) => {
                              const res = await fetch("/api/uploads/request-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
                              const { uploadURL } = await res.json();
                              return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                            }} onComplete={(res) => res.successful?.[0] && updateRequest({ id: request.id, data: { companion1PassportUrl: res.successful[0].uploadURL } })}>
                              <Button variant="outline" size="sm" className="flex-1 text-xs">{request.companion1PassportUrl ? "تم الرفع" : "رفع"}</Button>
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
                                    const res = await fetch("/api/uploads/request-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
                                    const { uploadURL } = await res.json();
                                    await fetch(uploadURL, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
                                    updateRequest({ id: request.id, data: { companion1PassportUrl: uploadURL.split('?')[0] } });
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
                            <ObjectUploader onGetUploadParameters={async (file) => {
                              const res = await fetch("/api/uploads/request-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
                              const { uploadURL } = await res.json();
                              return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                            }} onComplete={(res) => res.successful?.[0] && updateRequest({ id: request.id, data: { companion2PassportUrl: res.successful[0].uploadURL } })}>
                              <Button variant="outline" size="sm" className="flex-1 text-xs">{request.companion2PassportUrl ? "تم الرفع" : "رفع"}</Button>
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
                                    const res = await fetch("/api/uploads/request-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
                                    const { uploadURL } = await res.json();
                                    await fetch(uploadURL, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
                                    updateRequest({ id: request.id, data: { companion2PassportUrl: uploadURL.split('?')[0] } });
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
                  <Button className="w-full" onClick={() => setShowDocs(false)}>إغلاق</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Box 4: Rules & Policies */}
            <Dialog>
              <DialogTrigger asChild>
                <DashboardBox icon={ShieldCheck} title="القواعد والسياسات" disabled={true}>
                  <p className="text-xs text-muted-foreground">يرجى الاطلاع والالتزام بالقواعد</p>
                </DashboardBox>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>القواعد والسياسات</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4 prose prose-sm max-h-[60vh] overflow-y-auto">
                  {Array.isArray(materials) ? materials.filter((m: any) => m.type === 'instruction').map((m: any) => (
                    <div key={m.id} className="p-4 bg-muted/20 rounded-lg border">
                      <h4 className="font-bold text-primary mb-2">{m.title}</h4>
                      <p className="text-sm">{m.url}</p>
                    </div>
                  )) : <p className="text-center italic">لا توجد قواعد حالياً</p>}
                </div>
              </DialogContent>
            </Dialog>

            {/* Box 5: Tickets & Visas */}
            <DashboardBox icon={FileText} title="تذاكر والتأشيرات" disabled={!request.visaUrl && !request.ticketUrl}>
              <div className="flex gap-2 justify-center w-full">
                {request.visaUrl && <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.open(request.visaUrl!, '_blank'); }}><Download className="w-3 h-3 ml-1"/> تأشيرة</Button>}
                {request.ticketUrl && <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); window.open(request.ticketUrl!, '_blank'); }}><Download className="w-3 h-3 ml-1"/> تذكرة</Button>}
              </div>
              {(!request.visaUrl && !request.ticketUrl) && <p className="text-[10px] text-muted-foreground mt-2">ستظهر هنا عند توفرها</p>}
            </DashboardBox>

            {/* Box 6: Trip Colleagues */}
            <Dialog>
              <DialogTrigger asChild>
                <DashboardBox icon={Users} title="زملاء الرحلة" disabled={!request.assignedColleagueIds?.length}>
                  <p className="text-xs text-muted-foreground">{request.assignedColleagueIds?.length || 0} زملاء متاحين</p>
                </DashboardBox>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>زملاء الرحلة</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {Array.isArray(colleagues) && colleagues.length ? colleagues.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border">
                      <div>
                        <div className="font-bold">{c.fullName}</div>
                        <div className="text-xs text-muted-foreground">{c.department}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="text-green-600 hover:bg-green-50" onClick={() => window.open(`https://wa.me/${c.phone?.replace(/[^0-9]/g, '')}`, '_blank')}>
                          <MessageCircle className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-blue-600 hover:bg-blue-50" onClick={() => window.location.href = `tel:${c.phone}`}>
                          <Phone className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  )) : <p className="text-center italic">سيقوم الأدمن بإضافة الزملاء قريباً</p>}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
