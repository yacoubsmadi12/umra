import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, ChevronRight, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const CATEGORY_ICONS: Record<string, string> = {
  "جميع الأدعية": "https://cdn-icons-png.flaticon.com/512/2913/2913520.png",
  "النوم والاستيقاظ": "https://cdn-icons-png.flaticon.com/512/3094/3094834.png",
  "الأعمال اليومية": "https://cdn-icons-png.flaticon.com/512/2666/2666505.png",
  "استخدام الحمام": "https://cdn-icons-png.flaticon.com/512/2203/2203649.png",
  "الأكل والشرب": "https://cdn-icons-png.flaticon.com/512/2737/2737034.png",
  "الفرح": "https://cdn-icons-png.flaticon.com/512/4160/4160738.png",
  "الهم والحزن": "https://cdn-icons-png.flaticon.com/512/4160/4160754.png",
  "السفر": "https://cdn-icons-png.flaticon.com/512/201/201623.png",
  "الصلاة والمسجد": "https://cdn-icons-png.flaticon.com/512/2913/2913466.png",
  "التسبيح والذكر": "https://cdn-icons-png.flaticon.com/512/2913/2913495.png",
  "العمرة والحج": "https://cdn-icons-png.flaticon.com/512/2913/2913564.png",
  "المرض": "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
  "الصوم": "https://cdn-icons-png.flaticon.com/512/2913/2913540.png",
  "الموت والجنازة": "https://cdn-icons-png.flaticon.com/512/2913/2913580.png",
  "الفطرة": "https://cdn-icons-png.flaticon.com/512/2913/2913520.png"
};

export default function PrayersPage() {
  const [search, setSearch] = useState("");
  const { data: prayers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/prayers"],
  });

  const categories = prayers ? Array.from(new Set(prayers.map(p => p.category))) : [];
  
  const filteredCategories = categories.filter(cat => 
    cat.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto space-y-6 pb-20 font-tajawal" dir="rtl">
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-primary">الأقسام</h1>
            </div>
          </header>

          <Tabs defaultValue="categories" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="bg-muted/50 p-1 h-12 rounded-full border border-primary/10">
                <TabsTrigger 
                  value="categories" 
                  className="rounded-full px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  الأقسام
                </TabsTrigger>
                <TabsTrigger 
                  value="my-prayers" 
                  className="rounded-full px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                >
                  أدعيتي
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="categories" className="space-y-6 outline-none">
              <div className="relative">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="البحث عن دعاء"
                  className="pr-12 h-14 rounded-2xl bg-white dark:bg-card border-none shadow-sm focus-visible:ring-primary/20 text-lg"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-6 pt-4">
                {filteredCategories.map((cat) => {
                  const catPrayers = prayers?.filter(p => p.category === cat) || [];
                  const iconUrl = CATEGORY_ICONS[cat] || "https://cdn-icons-png.flaticon.com/512/2913/2913520.png";
                  
                  return (
                    <Dialog key={cat}>
                      <DialogTrigger asChild>
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex flex-col items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-24 h-24 rounded-full bg-white dark:bg-card flex items-center justify-center p-4 shadow-sm border border-primary/5 group-hover:border-primary/20 transition-all">
                            <img src={iconUrl} alt={cat} className="w-full h-full object-contain" />
                          </div>
                          <span className="text-sm font-bold text-center text-foreground group-hover:text-primary transition-colors">{cat}</span>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-primary/20 shadow-2xl p-0">
                        <DialogHeader className="p-6 pb-2 sticky top-0 bg-inherit z-10 border-b border-primary/10">
                          <DialogTitle className="text-right text-2xl font-bold text-primary flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 p-2">
                              <img src={iconUrl} alt={cat} className="w-full h-full object-contain" />
                            </div>
                            {cat}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="p-6 space-y-6 pt-4">
                          {catPrayers.map((p, idx) => (
                            <motion.div
                              key={p.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                            >
                              <Card className="border-primary/10 shadow-sm bg-white/50 dark:bg-card/50 overflow-hidden relative group">
                                <div className="absolute top-0 right-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
                                <CardContent className="p-6 space-y-4">
                                  <div className="flex justify-between items-start gap-4">
                                    <h4 className="font-bold text-primary text-xl leading-tight">{p.title}</h4>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/40 hover:text-primary rounded-full">
                                      <Heart className="w-4 h-4" />
                                    </Button>
                                  </div>
                                  <div className="bg-primary/5 rounded-2xl p-6 border border-primary/5">
                                    <p className="text-2xl leading-relaxed text-foreground/90 font-medium text-center font-cairo">
                                      {p.content}
                                    </p>
                                  </div>
                                  {p.translation && (
                                    <p className="text-sm text-muted-foreground italic border-t border-primary/5 pt-3 pr-2">
                                      {p.translation}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="my-prayers" className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Heart className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">قريباً.. ستتمكن من إضافة أدعيتك الخاصة هنا</p>
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
