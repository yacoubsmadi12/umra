import { useColleagues } from "@/hooks/use-colleagues";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Users } from "lucide-react";

export default function Colleagues() {
  const { data: colleagues, isLoading } = useColleagues();

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

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-tajawal text-primary">زملاء الرحلة</h1>
              <p className="text-muted-foreground">تعرف على زملائك المشاركين في برنامج العمرة</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colleagues?.map((colleague, index) => (
              <Card key={index} className="p-4 flex items-center gap-4 hover:shadow-md transition-all border-primary/5 bg-white/50 backdrop-blur-sm">
                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {colleague.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-gray-900">{colleague.fullName}</h3>
                  <p className="text-xs text-muted-foreground">{colleague.department}</p>
                </div>
              </Card>
            ))}
          </div>

          {colleagues?.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              لا يوجد مشاركين آخرين حتى الآن
            </p>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
