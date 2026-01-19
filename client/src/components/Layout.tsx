import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Users, 
  LogOut, 
  ClipboardList 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
}

export function Layout({ children, isAdmin }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout, user } = useAuth();
  const [location] = useLocation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const navItems = isAdmin
    ? [
        { href: "/admin", label: "لوحة التحكم", icon: ClipboardList },
      ]
    : [
        { href: "/dashboard", label: "الرئيسية", icon: Home },
      ];

  return (
    <div dir="rtl" className="min-h-screen bg-background relative overflow-hidden font-cairo">
      {/* Decorative Background Pattern */}
      <div className="fixed inset-0 bg-islamic-pattern pointer-events-none z-0" />

      {/* Navbar (Mobile) */}
      <div className="lg:hidden fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <button onClick={toggleSidebar} className="p-2 hover:bg-muted rounded-full text-primary">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-tajawal font-bold text-primary">برنامج العمرة</h1>
        {/* Placeholder for balance */}
        <div className="w-10" /> 
      </div>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed top-0 right-0 h-full w-72 bg-card border-l border-border z-40 shadow-2xl lg:shadow-none lg:translate-x-0",
              "lg:block", // Always show on desktop
              !isSidebarOpen && "hidden lg:block" // Hide on mobile if closed
            )}
          >
            <div className="flex flex-col h-full p-6">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">Z</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight">برنامج العمرة</h2>
                    <p className="text-xs text-muted-foreground">زين الأردن</p>
                  </div>
                </div>
                <button onClick={toggleSidebar} className="lg:hidden p-1 hover:bg-muted rounded-full">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-sm text-muted-foreground mb-1">مرحباً بك،</p>
                <p className="font-bold text-primary">{user?.fullName}</p>
                <p className="text-xs text-muted-foreground mt-1">{user?.jobTitle}</p>
              </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setIsSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer",
                    location === item.href
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}

            {isAdmin && location === "/admin" && (
              <div className="mt-4 pt-4 border-t border-primary/10 space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground px-4 mb-2 uppercase tracking-wider">تصفية الطلبات</p>
                {[
                  { id: 'pending', label: 'قيد الانتظار' },
                  { id: 'approved', label: 'المقبولة' },
                  { id: 'rejected', label: 'المرفوضة' },
                  { id: 'registered', label: 'المسجلون' },
                  { id: 'past', label: 'المقبولين بالعمرة الماضية' },
                  { id: 'all', label: 'الكل' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      const event = new CustomEvent('admin-tab-change', { detail: tab.id });
                      window.dispatchEvent(event);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            )}
          </nav>

              <button
                onClick={() => logout()}
                className="flex items-center gap-4 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors mt-auto"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">تسجيل الخروج</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen pt-20 lg:pt-8 px-4 pb-12 lg:pr-80 lg:pl-8 transition-all duration-300 relative z-10",
        isSidebarOpen && "lg:pr-80"
      )}>
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
