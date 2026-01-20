import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock } from "lucide-react";

export default function PrayerTimesPage() {
  const { data: ammanTimes } = useQuery({
    queryKey: ["https://api.aladhan.com/v1/timingsByCity?city=Amman&country=Jordan&method=4"],
  });

  const { data: meccaTimes } = useQuery({
    queryKey: ["https://api.aladhan.com/v1/timingsByCity?city=Mecca&country=Saudi+Arabia&method=4"],
  });

  const PrayerRow = ({ label, time }: { label: string, time: string }) => (
    <div className="flex justify-between items-center py-3 border-b border-primary/5 last:border-0">
      <span className="font-bold text-primary/70">{label}</span>
      <span className="text-lg font- Tajawal">{time}</span>
    </div>
  );

  const labels: any = {
    Fajr: "الفجر",
    Sunrise: "الشروق",
    Dhuhr: "الظهر",
    Asr: "العصر",
    Maghrib: "المغرب",
    Isha: "العشاء"
  };

  return (
    <div className="container mx-auto p-4 space-y-6 text-right" dir="rtl">
      <Tabs defaultValue="amman" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="amman" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> الأردن (عمان)
          </TabsTrigger>
          <TabsTrigger value="mecca" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> السعودية (مكة)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="amman">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 rounded-t-lg">
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" /> مواقيت الصلاة في عمان
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {ammanTimes?.data?.timings ? (
                Object.entries(labels).map(([key, label]: [string, any]) => (
                  <PrayerRow key={key} label={label} time={ammanTimes.data.timings[key]} />
                ))
              ) : <p className="text-center">جاري التحميل...</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mecca">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="bg-primary/5 rounded-t-lg">
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" /> مواقيت الصلاة في مكة المكرمة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {meccaTimes?.data?.timings ? (
                Object.entries(labels).map(([key, label]: [string, any]) => (
                  <PrayerRow key={key} label={label} time={meccaTimes.data.timings[key]} />
                ))
              ) : <p className="text-center">جاري التحميل...</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
