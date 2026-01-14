import { useAuth } from "@/hooks/use-auth";
import { useAllRequests, useUpdateRequest } from "@/hooks/use-requests";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check, X, Upload, FileText } from "lucide-react";
import { useState } from "react";
import { ObjectUploader } from "@/components/ObjectUploader";

export default function AdminDashboard() {
  const { data: requests, isLoading } = useAllRequests();
  const { mutate: updateRequest } = useUpdateRequest();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

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
                       if (res.successful[0]) handleFileUpload(req.id, 'visa', res.successful[0].uploadURL);
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
                       if (res.successful[0]) handleFileUpload(req.id, 'ticket', res.successful[0].uploadURL);
                     }}
                  >
                     <div className="w-full">
                       <Button variant="outline" size="sm" className="w-full text-xs" disabled={!!req.ticketUrl}>
                         <Upload className="w-3 h-3 mr-1" /> {req.ticketUrl ? 'تم رفع التذكرة' : 'رفع التذكرة'}
                       </Button>
                     </div>
                  </ObjectUploader>
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
            <TabsList className="w-full grid grid-cols-4 lg:w-[400px]">
              <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
              <TabsTrigger value="approved">المقبولة</TabsTrigger>
              <TabsTrigger value="rejected">المرفوضة</TabsTrigger>
              <TabsTrigger value="all">الكل</TabsTrigger>
            </TabsList>
            
            <div className="mt-6">
              <TabsContent value="pending"><RequestList filterStatus="pending" /></TabsContent>
              <TabsContent value="approved"><RequestList filterStatus="approved" /></TabsContent>
              <TabsContent value="rejected"><RequestList filterStatus="rejected" /></TabsContent>
              <TabsContent value="all"><RequestList filterStatus="all" /></TabsContent>
            </div>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
