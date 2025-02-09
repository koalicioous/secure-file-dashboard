import type { FileItem } from "~/types";
import DOMPurify from "dompurify";
import { useSimpleAuth } from "~/hooks/useSimpleAuth";
import { Worker } from "@react-pdf-viewer/core";
import { Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";

import "@react-pdf-viewer/core/lib/styles/index.css";
import { useFileMetadata } from "~/hooks/files/useFileMetadata";
import { Button } from "../ui/button";
import { CircleX, DownloadCloud } from "lucide-react";
import { useDownloadFile } from "~/hooks/files/useDownloadFile";

const buildUrl = (token: string, path: string) => {
  if (!token || !path) return "";
  return `/file/${token}/${path}`;
};

const SanitizedPreview = ({
  content,
  onClose,
}: {
  content: FileItem | null;
  onClose: () => void;
}) => {
  const { currentUser = "" } = useSimpleAuth();

  const metadata = useFileMetadata({ fileId: content?.id as string });

  const sanitizedFileName = DOMPurify.sanitize(content?.name as string);

  const checksum = metadata?.checksum;

  const { downloadFile } = useDownloadFile();

  if (!content) return null;

  const contentUrl = buildUrl(currentUser as string, content?.url as string);

  return (
    <div className="my-4">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold mb-2">
          File Preview: {sanitizedFileName ?? "N/A"}
        </h1>
        <div className="flex items-center gap-2">
          <Button
            disabled={!metadata?.uniqueFileName}
            variant="outline"
            onClick={() => downloadFile(metadata?.uniqueFileName as string)}
            aria-label="Download File"
          >
            <DownloadCloud className="size-4" />
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            aria-label="Close Preview"
          >
            <CircleX className="size-4" />
          </Button>
        </div>
      </div>
      {checksum && (
        <div className="my-2 p-2 rounded text-xs bg-neutral-100">
          Download Integrity SHA: {checksum}
        </div>
      )}
      <div className="max-w-[500px] w-full mx-auto">
        <div className=" mx-auto w-full h-[400px] overflow-auto">
          {content && content?.type === "application/pdf" && contentUrl && (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <Viewer
                fileUrl={contentUrl}
                defaultScale={SpecialZoomLevel.PageFit}
              />
            </Worker>
          )}
          {content?.type === "image/png" && contentUrl && (
            <img
              src={contentUrl}
              alt={content?.name}
              style={{ maxWidth: "100%" }}
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SanitizedPreview;
