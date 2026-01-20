import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Sun, Moon, Sunrise, Sunset, CloudSun, Timer } from "lucide-react";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function PrayerTimesPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: ammanTimes, isLoading: loadingAmman } = useQuery({
    queryKey: ["https://api.aladhan.com/v1/timingsByCity?city=Amman&country=Jordan&method=4"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0]);
      return res.json();
    }
  });

  const { data: meccaTimes, isLoading: loadingMecca } = useQuery({
    queryKey: ["https://api.aladhan.com/v1/timingsByCity?city=Mecca&country=Saudi+Arabia&method=4"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0]);
      return res.json();
    }
  });

  const PrayerCard = ({ label, time, icon: Icon, isActive }: { label: string, time: string, icon: any, isActive?: boolean }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-4 rounded-2xl border transition-all duration-300 ${
        isActive 
          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105 z-10" 
          : "bg-white dark:bg-card border-primary/10 hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isActive ? "bg-white/20" : "bg-primary/5 text-primary"}`}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">{label}</span>
        </div>
        <span className="text-xl font-bold font-mono tracking-wider">{time}</span>
      </div>
      {isActive && (
        <motion.div 
          layoutId="active-indicator"
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-full"
        />
      )}
    </motion.div>
  );

  const labels = [
    { key: "Fajr", label: "الفجر", icon: Moon },
    { key: "Sunrise", label: "الشروق", icon: Sunrise },
    { key: "Dhuhr", label: "الظهر", icon: Sun },
    { key: "Asr", label: "العصر", icon: CloudSun },
    { key: "Maghrib", label: "المغرب", icon: Sunset },
    { key: "Isha", label: "العشاء", icon: Moon }
  ];

  const checkIsActive = (prayerTime: string) => {
    if (!prayerTime) return false;
    const [hours, minutes] = prayerTime.split(":").map(Number);
    const prayerDate = new Date();
    prayerDate.setHours(hours, minutes, 0);
    
    const now = new Date();
    const diff = now.getTime() - prayerDate.getTime();
    return diff >= 0 && diff < 1800000; // Active if within 30 mins of start
  };

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
              <h1 className="text-2xl font-bold text-primary">مواقيت الصلاة</h1>
            </div>
            <div className="bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10 flex items-center gap-3">
              <Timer className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </header>

          <Tabs defaultValue="amman" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-muted/50 p-1 h-12 rounded-full border border-primary/10">
                <TabsTrigger 
                  value="amman" 
                  className="rounded-full px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> الأردن (عمان)
                </TabsTrigger>
                <TabsTrigger 
                  value="mecca" 
                  className="rounded-full px-8 h-10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" /> السعودية (مكة)
                </TabsTrigger>
              </TabsList>
            </div>

            <AnimatePresence mode="wait">
              <TabsContent value="amman" className="space-y-4 outline-none">
                {loadingAmman ? (
                  <div className="flex justify-center py-20"><Clock className="w-10 h-10 animate-spin text-primary opacity-20" /></div>
                ) : (
                  <div className="grid gap-4">
                    {labels.map((item) => (
                      <PrayerCard 
                        key={item.key} 
                        label={item.label} 
                        time={ammanTimes?.data?.timings[item.key]} 
                        icon={item.icon}
                        isActive={checkIsActive(ammanTimes?.data?.timings[item.key])}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mecca" className="space-y-4 outline-none">
                {loadingMecca ? (
                  <div className="flex justify-center py-20"><Clock className="w-10 h-10 animate-spin text-primary opacity-20" /></div>
                ) : (
                  <div className="grid gap-4">
                    {labels.map((item) => (
                      <PrayerCard 
                        key={item.key} 
                        label={item.label} 
                        time={meccaTimes?.data?.timings[item.key]} 
                        icon={item.icon}
                        isActive={checkIsActive(meccaTimes?.data?.timings[item.key])}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
