import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import XHRUpload from "@uppy/xhr-upload";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import { Button } from "@/components/ui/button";

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
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ["image/*", ".pdf"],
      },
      autoProceed: false,
    })
      .use(XHRUpload, {
        endpoint: "/api/uploads/local",
        formData: true,
        fieldName: "file",
      })
      .on("complete", (result) => {
        if (result.successful && result.successful.length > 0) {
          const response = result.successful[0].response;
          if (response && response.body) {
            onComplete?.({
              url: (response.body as any).url,
              objectPath: (response.body as any).objectPath,
            });
          }
          setShowModal(false);
          uppy.cancelAll();
        }
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
