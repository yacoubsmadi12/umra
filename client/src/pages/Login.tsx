import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { login, isLoggingIn } = useAuth();
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ employeeId, password });
  };

  return (
    <div dir="rtl" className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-cairo">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] scale-110 animate-slow-zoom"
        style={{ backgroundImage: `url(https://i.postimg.cc/hj95w098/b.png)` }}
      />
      <div className="absolute inset-0 bg-[#053046]/70 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8 text-white">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-accent to-yellow-300 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3">
               {/* Zain Logo Placeholder or Kaaba Icon */}
               <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-[#074668]" stroke="currentColor" strokeWidth="2">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
               </svg>
            </div>
            <h1 className="text-3xl font-bold font-tajawal text-center mb-2">برنامج العمرة</h1>
            <p className="text-blue-100 text-center text-sm">بوابة الموظفين - زين الأردن</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="employeeId" className="text-blue-50">رقم الموظف</Label>
              <Input
                id="employeeId"
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="مثال: 1001"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-50">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-accent focus:ring-accent"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-12 text-lg bg-accent hover:bg-accent/90 text-[#074668] font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  جاري الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-xs text-blue-200">
              للمساعدة يرجى التواصل مع قسم الموارد البشرية
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
