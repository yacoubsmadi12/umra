import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ObjectUploaderProps {
  onComplete?: (result: { url: string; objectPath: string }) => void;
  buttonClassName?: string;
  children: ReactNode;
  verifyPassport?: boolean;
}

export function ObjectUploader({
  onComplete,
  buttonClassName,
  children,
  verifyPassport = false,
}: ObjectUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [extractedData, setExtractedData] = useState<string | null>(null);
  const [tempResult, setTempResult] = useState<{ url: string; objectPath: string } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/local", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        if (verifyPassport) {
          // Trigger OCR and wait for it
          const ocrResponse = await fetch("/api/ai/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              type: "passportData", 
              url: data.url 
            }),
          });
          const ocrData = await ocrResponse.json();
          setExtractedData(ocrData.result);
          setTempResult(data);
          setShowVerify(true);
        } else {
          onComplete?.({
            url: data.url,
            objectPath: data.objectPath,
          });
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const confirmUpload = () => {
    if (tempResult) {
      onComplete?.(tempResult);
    }
    setShowVerify(false);
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,.pdf"
        className="hidden"
      />
      <Button
        onClick={() => fileInputRef.current?.click()}
        className={buttonClassName}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : null}
        {children}
      </Button>

      <Dialog open={showVerify} onOpenChange={setShowVerify}>
        <DialogContent className="sm:max-w-md font-tajawal">
          <DialogHeader>
            <DialogTitle className="text-center">التحقق من بيانات جواز السفر</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 bg-primary/5 rounded-xl text-sm border border-primary/10 whitespace-pre-wrap leading-relaxed">
              {extractedData || "جاري استخراج البيانات..."}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              هل البيانات المستخرجة صحيحة؟ يمكنك التأكيد أو إعادة الرفع.
            </p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowVerify(false)}>
              <X className="w-4 h-4 ml-1" /> إعادة الرفع
            </Button>
            <Button className="flex-1" onClick={confirmUpload}>
              <Check className="w-4 h-4 ml-1" /> تأكيد البيانات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
