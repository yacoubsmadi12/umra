import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ExternalLink, Loader2 } from "lucide-react";
import { api } from "@shared/routes";
import { motion } from "framer-motion";

export default function CompetitionsPage() {
  const { data: settings, isLoading } = useQuery({
    queryKey: [api.email.getSettings.path],
  });

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

  const competitionLink = (settings as any)?.competitionLink;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-8 py-8 font-tajawal" dir="rtl">
          <header className="text-center space-y-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary"
            >
              <Trophy className="w-10 h-10" />
            </motion.div>
            <h1 className="text-4xl font-bold text-primary">المسابقات</h1>
            <p className="text-muted-foreground text-lg">شارك في مسابقاتنا المميزة واربح جوائز قيمة</p>
          </header>

          <Card className="border-primary/20 overflow-hidden shadow-xl">
            <CardContent className="p-0">
              <div className="bg-primary/5 p-8 text-center space-y-6">
                {competitionLink ? (
                  <>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold">مسابقة العمرة الكبرى</h2>
                      <p className="text-muted-foreground">اضغط على الزر أدناه للانتقال إلى صفحة المسابقة والمشاركة</p>
                    </div>
                    <Button 
                      size="lg" 
                      className="h-16 px-12 text-xl font-bold rounded-full shadow-lg hover:shadow-primary/20 transition-all gap-3"
                      onClick={() => window.open(competitionLink, "_blank")}
                    >
                      <ExternalLink className="w-6 h-6" />
                      ابدأ المسابقة الآن
                    </Button>
                  </>
                ) : (
                  <div className="py-12 space-y-4">
                    <Trophy className="w-16 h-16 mx-auto text-muted-foreground opacity-20" />
                    <p className="text-xl text-muted-foreground font-medium">لا توجد مسابقات جارية حالياً.. انتظرونا قريباً</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border-primary/10">
              <h3 className="font-bold text-lg mb-2">كيفية المشاركة؟</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                ببساطة قم بالنقر على زر "ابدأ المسابقة" وسيتم توجيهك إلى نموذج المسابقة. تأكد من إدخال بياناتك الوظيفية الصحيحة لضمان تسجيل مشاركتك.
              </p>
            </Card>
            <Card className="p-6 border-primary/10">
              <h3 className="font-bold text-lg mb-2">الشروط والأحكام</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                تخضع جميع المسابقات لشروط وقوانين شركة زين الأردن. سيتم الإعلان عن الفائزين عبر قنوات التواصل الرسمية للشركة.
              </p>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
