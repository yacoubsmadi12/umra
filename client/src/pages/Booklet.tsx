import { useMaterials } from "@/hooks/use-materials";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, ChevronRight, ChevronLeft, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Booklet() {
  const { data: materials, isLoading } = useMaterials();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter only booklet pages for the flip view
  const pages = materials?.filter(m => m.type === 'booklet_page') || [];
  
  const next = () => setCurrentIndex(i => (i + 1) % pages.length);
  const prev = () => setCurrentIndex(i => (i - 1 + pages.length) % pages.length);

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
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-tajawal text-primary flex items-center justify-center gap-3">
              <BookOpen className="w-8 h-8" />
              دليل المعتمر
            </h1>
            <p className="text-muted-foreground">دليلك الشامل لخطوات ومناسك العمرة</p>
          </div>

          {pages.length > 0 ? (
            <div className="relative aspect-[3/4] md:aspect-[16/9] bg-white rounded-3xl shadow-2xl overflow-hidden border border-primary/10">
              <div className="absolute inset-0 flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 to-accent/5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full flex flex-col items-center justify-center text-center space-y-6"
                  >
                    <h2 className="text-2xl md:text-4xl font-bold text-primary">{pages[currentIndex].title}</h2>
                    {/* Placeholder for actual content/image */}
                    <div className="prose prose-lg text-muted-foreground max-w-2xl">
                       <p>محتوى الصفحة سيظهر هنا. يمكن أن يكون نصاً أو صورة توضيحية للمناسك.</p>
                       {/* If URL is image */}
                       <img 
                         src={pages[currentIndex].url || "https://images.unsplash.com/photo-1565552629477-ff1459a58130?w=800&q=80"} 
                         alt={pages[currentIndex].title}
                         className="rounded-xl shadow-lg mt-8 max-h-[40vh] object-cover mx-auto"
                       />
                       {/* Descriptive comment for unspash: generic islamic architecture */}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Controls */}
              <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
                <Button 
                  onClick={prev} 
                  variant="secondary" 
                  size="icon" 
                  className="pointer-events-auto rounded-full shadow-lg bg-white/80 hover:bg-white w-12 h-12"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
                
                <Button 
                  onClick={next} 
                  variant="secondary" 
                  size="icon" 
                  className="pointer-events-auto rounded-full shadow-lg bg-white/80 hover:bg-white w-12 h-12"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              </div>

              <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
                صفحة {currentIndex + 1} من {pages.length}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              لا توجد صفحات متاحة حالياً
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
