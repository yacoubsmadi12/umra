import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";

interface ObjectUploaderProps {
  onComplete?: (result: { url: string; objectPath: string }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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
        onComplete?.({
          url: data.url,
          objectPath: data.objectPath,
        });
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
    </div>
  );
}
