import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function PrayersPage() {
  const [search, setSearch] = useState("");
  const { data: prayers, isLoading } = useQuery<any[]>({
    queryKey: ["/api/prayers"],
  });

  const categories = prayers ? Array.from(new Set(prayers.map(p => p.category))) : [];
  
  const filteredPrayers = prayers?.filter(p => 
    p.title.includes(search) || 
    p.content.includes(search) || 
    p.category.includes(search)
  );

  return (
    <div className="container mx-auto p-4 space-y-6 dir-rtl text-right" dir="rtl">
      <div className="relative">
        <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="البحث عن دعاء..."
          className="pr-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {categories.map((cat) => {
          const catPrayers = prayers?.filter(p => p.category === cat) || [];
          const firstPrayer = catPrayers[0];
          return (
            <Dialog key={cat}>
              <DialogTrigger asChild>
                <div className="flex flex-col items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-3xl shadow-sm border border-primary/20">
                    {firstPrayer?.icon || "🙏"}
                  </div>
                  <span className="text-xs font-bold text-center">{cat}</span>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-right">{cat}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {catPrayers.map((p) => (
                    <Card key={p.id} className="border-primary/20">
                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-bold text-primary">{p.title}</h4>
                        <p className="text-lg leading-relaxed text-foreground/80">{p.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>
    </div>
  );
}
