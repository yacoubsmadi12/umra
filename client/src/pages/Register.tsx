import { useAuth } from "@/hooks/use-auth";
import { useCreateRequest } from "@/hooks/use-requests";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Redirect } from "wouter";

export default function Register() {
  const { user } = useAuth();
  const { mutate: createRequest, isPending } = useCreateRequest();
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // If user already has a request, we might want to redirect them to dashboard
  // But for now, let's assume the router handles that logic or we check it here
  
  const handleSubmit = () => {
    if (!agreed) return;
    createRequest({ checklistCompleted: true }, {
      onSuccess: () => setSubmitted(true)
    });
  };

  if (submitted) {
    return <Redirect to="/dashboard" />;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-tajawal text-primary">التسجيل في برنامج العمرة</h1>
            <p className="text-muted-foreground">يرجى مراجعة بياناتك والموافقة على الشروط والأحكام</p>
          </div>

          <Card className="p-8 border-primary/10 shadow-lg">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">البيانات الشخصية</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">الاسم الكامل</p>
                    <p className="font-semibold">{user?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">رقم الموظف</p>
                    <p className="font-semibold">{user?.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">القسم</p>
                    <p className="font-semibold">{user?.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">المسمى الوظيفي</p>
                    <p className="font-semibold">{user?.jobTitle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">رقم الهاتف</p>
                    <p className="font-semibold">{user?.phone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-semibold">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 p-6 rounded-xl border border-dashed border-primary/20">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  الشروط والأحكام
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
                  <li>يجب أن يكون جواز السفر ساري المفعول لمدة لا تقل عن 6 أشهر.</li>
                  <li>الموافقة على خصم التكاليف من الراتب أو العلاوة حسب النظام.</li>
                  <li>الالتزام بحضور الدورة الإرشادية قبل السفر.</li>
                  <li>الالتزام بمواعيد السفر المحددة من قبل الشركة.</li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 pt-6 border-t">
              <div className="flex items-center gap-3">
                <Checkbox 
                  id="terms" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="w-5 h-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-white"
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  أقر بصحة البيانات وأوافق على الشروط والأحكام المذكورة أعلاه
                </label>
              </div>

              <Button 
                onClick={handleSubmit} 
                disabled={!agreed || isPending}
                size="lg"
                className="w-full md:w-auto min-w-[200px] text-lg bg-primary hover:bg-primary/90"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  "تأكيد التسجيل"
                )}
              </Button>
            </div>
          </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
