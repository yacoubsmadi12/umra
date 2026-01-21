import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ContactInfo } from "@shared/schema";
import { Phone, MessageCircle, User, Activity, ShieldCheck, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function TeamContactSection() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: contacts } = useQuery<ContactInfo[]>({
    queryKey: ["/api/contact-info"]
  });

  const leader = contacts?.find(c => c.type === 'leader');
  const admin = contacts?.find(c => c.type === 'admin');
  const doctor = contacts?.find(c => c.type === 'doctor');

  const teamMembers = [
    { title: "أمير الرحلة", data: leader, icon: ShieldCheck, color: "text-blue-500" },
    { title: "الإداري", data: admin, icon: Users, color: "text-green-500" },
    { title: "طبيب الرحلة", data: doctor, icon: Activity, color: "text-red-500" },
  ];

  return (
    <div className="mt-8">
      <Button 
        variant="outline" 
        className="w-full h-16 text-lg font-bold gap-3 hover-elevate"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Users className="w-6 h-6" />
        معلومات الاتصال بفريق زين
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-2">
              {teamMembers.map((member, idx) => (
                <motion.div
                  key={member.title}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover-elevate">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`p-3 rounded-full bg-muted ${member.color}`}>
                          <member.icon className="w-8 h-8" />
                        </div>
                        <h3 className="font-bold text-lg">{member.title}</h3>
                        {member.data ? (
                          <>
                            <p className="text-sm font-medium">{member.data.name}</p>
                            <div className="flex gap-2 w-full mt-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 gap-2"
                                onClick={() => window.open(`https://wa.me/${member.data?.phone.replace(/\s+/g, '')}`, '_blank')}
                              >
                                <MessageCircle className="w-4 h-4" />
                                واتساب
                              </Button>
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="flex-1 gap-2"
                                onClick={() => window.location.href = `tel:${member.data?.phone}`}
                              >
                                <Phone className="w-4 h-4" />
                                اتصال
                              </Button>
                            </div>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">لم يتم إدخال البيانات</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
