import { useAuth } from "@/hooks/use-auth";
import { useMyRequest, useUpdateRequest } from "@/hooks/use-requests";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Loader2, CheckCircle2, XCircle, Clock, Upload, Download, CreditCard, Users } from "lucide-react";
import { Redirect } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

function StatusCard({ status, comments }: { status: string, comments?: string | null }) {
  const config = {
    pending: { color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: Clock, label: "قيد المراجعة" },
    approved: { color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2, label: "تمت الموافقة" },
    rejected: { color: "text-red-600 bg-red-50 border-red-200", icon: XCircle, label: "مرفوض" },
  };

  const current = config[status as keyof typeof config] || config.pending;
  const Icon = current.icon;

  return (
    <div className={`p-6 rounded-2xl border ${current.color} flex flex-col items-center text-center gap-3`}>
      <Icon className="w-12 h-12" />
      <div>
        <h3 className="font-bold text-xl mb-1">{current.label}</h3>
        <p className="text-sm opacity-80">
          {status === 'pending' && "طلبك قيد المراجعة من قبل إدارة الموارد البشرية"}
          {status === 'approved' && "مبروك! تمت الموافقة على طلبك. يرجى استكمال الخطوات التالية."}
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

  // Redirect to register if no request exists
  if (!request) {
    return <Redirect to="/register" />;
  }

  const handlePaymentMethodChange = (value: string) => {
    updateRequest({ id: request.id, data: { paymentMethod: value as any } });
  };

  const handlePassportUpload = (url: string) => {
    updateRequest({ id: request.id, data: { passportUrl: url } });
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6 animate-in fade-in duration-500">
          <header className="flex items-center justify-between">
            <h1 className="text-2xl font-bold font-tajawal text-primary">حالة الطلب</h1>
            <Badge variant="outline" className="text-sm py-1 px-3">
              رقم الطلب: #{request.id}
            </Badge>
          </header>

          <StatusCard status={request.status} comments={request.adminComments} />

          {request.status === 'approved' && (
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              {/* Payment Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 h-full border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4 text-primary">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">طريقة الدفع</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>اختر طريقة الدفع المناسبة</Label>
                      <Select 
                        value={request.paymentMethod || ""} 
                        onValueChange={handlePaymentMethodChange}
                        disabled={!!request.paymentMethod || isUpdating}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="اختر الطريقة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="salary_deduction">خصم من الراتب</SelectItem>
                          <SelectItem value="entertainment_allowance">علاوة ترفيه</SelectItem>
                          <SelectItem value="cash">دفع نقدي</SelectItem>
                          <SelectItem value="cliQ">CliQ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {request.paymentMethod && (
                      <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        تم حفظ اختيارك
                      </p>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Passport Upload Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6 h-full border-primary/10 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4 text-primary">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Upload className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-lg">صورة جواز السفر</h3>
                  </div>

                  <div className="space-y-4">
                    {request.passportUrl ? (
                      <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-medium truncate max-w-[200px]">تم رفع الملف بنجاح</span>
                        <a 
                          href={request.passportUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          عرض الملف
                        </a>
                      </div>
                    ) : (
                      <div className="text-center p-6 border-2 border-dashed rounded-lg border-muted-foreground/20">
                         <ObjectUploader
                           onGetUploadParameters={async (file) => {
                             const res = await fetch("/api/uploads/request-url", {
                               method: "POST",
                               headers: { "Content-Type": "application/json" },
                               body: JSON.stringify({
                                 name: file.name,
                                 size: file.size,
                                 contentType: file.type,
                               }),
                             });
                             const { uploadURL } = await res.json();
                             return {
                               method: "PUT",
                               url: uploadURL,
                               headers: { "Content-Type": file.type },
                             };
                           }}
                           onComplete={(result) => {
                             if (result.successful?.[0]) {
                               const url = result.successful[0].uploadURL;
                               if (url) handlePassportUpload(url);
                             }
                           }}
                         >
                           <div className="space-y-2 cursor-pointer">
                             <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                             <p className="text-sm text-muted-foreground">اضغط لرفع صورة الجواز</p>
                           </div>
                         </ObjectUploader>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>

              {/* Documents Download Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2"
              >
                <Card className="p-6 border-primary/10 shadow-sm bg-accent/5">
                   <h3 className="font-bold text-lg mb-4 text-primary">المستندات والتذاكر</h3>
                   <div className="grid sm:grid-cols-2 gap-4">
                     <Button 
                       variant="outline" 
                       className="h-auto py-4 justify-start gap-4 border-primary/20 hover:bg-white"
                       disabled={!request.visaUrl}
                       onClick={() => request.visaUrl && window.open(request.visaUrl, '_blank')}
                     >
                       <div className="p-2 bg-primary/10 rounded-full text-primary">
                         <Download className="w-5 h-5" />
                       </div>
                       <div className="text-right">
                         <div className="font-bold">تأشيرة العمرة</div>
                         <div className="text-xs text-muted-foreground">
                           {request.visaUrl ? "جاهز للتحميل" : "قيد المعالجة..."}
                         </div>
                       </div>
                     </Button>

                     <Button 
                       variant="outline" 
                       className="h-auto py-4 justify-start gap-4 border-primary/20 hover:bg-white"
                       disabled={!request.ticketUrl}
                       onClick={() => request.ticketUrl && window.open(request.ticketUrl, '_blank')}
                     >
                       <div className="p-2 bg-primary/10 rounded-full text-primary">
                         <Download className="w-5 h-5" />
                       </div>
                       <div className="text-right">
                         <div className="font-bold">تذكرة الطيران</div>
                         <div className="text-xs text-muted-foreground">
                           {request.ticketUrl ? "جاهز للتحميل" : "قيد المعالجة..."}
                         </div>
                       </div>
                     </Button>
                   </div>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Companion Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 border-primary/10 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-primary">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-lg">المرافقين (اختياري)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="needsCompanion" className="text-sm font-medium">هل تحتاج إلى مرافق؟</Label>
                  <Checkbox
                    id="needsCompanion"
                    checked={request.needsCompanion || false}
                    onCheckedChange={(checked) => {
                      updateRequest({ id: request.id, data: { needsCompanion: !!checked } });
                    }}
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <AnimatePresence>
                {request.needsCompanion && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-6 overflow-hidden"
                  >
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Companion 1 */}
                      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-muted-foreground/10">
                        <div className="space-y-2">
                          <Label>اسم المرافق الأول</Label>
                          <Input
                            placeholder="الاسم الكامل"
                            defaultValue={request.companion1Name || ""}
                            onBlur={(e) => {
                              if (e.target.value !== request.companion1Name) {
                                updateRequest({ id: request.id, data: { companion1Name: e.target.value } });
                              }
                            }}
                            disabled={isUpdating}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">جواز سفر المرافق الأول</Label>
                          {request.companion1PassportUrl ? (
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border text-xs">
                              <span className="text-green-600 font-medium">تم الرفع</span>
                              <a href={request.companion1PassportUrl} target="_blank" rel="noreferrer" className="text-primary underline">عرض</a>
                            </div>
                          ) : (
                            <ObjectUploader
                              onGetUploadParameters={async (file) => {
                                const res = await fetch("/api/uploads/request-url", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                                });
                                const { uploadURL } = await res.json();
                                return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                              }}
                              onComplete={(res) => {
                                if (res.successful?.[0]?.uploadURL) {
                                  updateRequest({ id: request.id, data: { companion1PassportUrl: res.successful[0].uploadURL } });
                                }
                              }}
                            >
                              <Button variant="outline" size="sm" className="w-full text-xs" disabled={isUpdating}>
                                <Upload className="w-3 h-3 ml-2" /> رفع الجواز
                              </Button>
                            </ObjectUploader>
                          )}
                        </div>
                      </div>

                      {/* Companion 2 */}
                      <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-muted-foreground/10">
                        <div className="space-y-2">
                          <Label>اسم المرافق الثاني</Label>
                          <Input
                            placeholder="الاسم الكامل"
                            defaultValue={request.companion2Name || ""}
                            onBlur={(e) => {
                              if (e.target.value !== request.companion2Name) {
                                updateRequest({ id: request.id, data: { companion2Name: e.target.value } });
                              }
                            }}
                            disabled={isUpdating}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">جواز سفر المرافق الثاني</Label>
                          {request.companion2PassportUrl ? (
                            <div className="flex items-center justify-between bg-white p-2 rounded-lg border text-xs">
                              <span className="text-green-600 font-medium">تم الرفع</span>
                              <a href={request.companion2PassportUrl} target="_blank" rel="noreferrer" className="text-primary underline">عرض</a>
                            </div>
                          ) : (
                            <ObjectUploader
                              onGetUploadParameters={async (file) => {
                                const res = await fetch("/api/uploads/request-url", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
                                });
                                const { uploadURL } = await res.json();
                                return { method: "PUT", url: uploadURL, headers: { "Content-Type": file.type } };
                              }}
                              onComplete={(res) => {
                                if (res.successful?.[0]?.uploadURL) {
                                  updateRequest({ id: request.id, data: { companion2PassportUrl: res.successful[0].uploadURL } });
                                }
                              }}
                            >
                              <Button variant="outline" size="sm" className="w-full text-xs" disabled={isUpdating}>
                                <Upload className="w-3 h-3 ml-2" /> رفع الجواز
                              </Button>
                            </ObjectUploader>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
