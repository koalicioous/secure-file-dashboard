import type { FileItem } from "~/types";
import DOMPurify from "dompurify";
import { useSimpleAuth } from "~/hooks/useSimpleAuth";
import { Worker } from "@react-pdf-viewer/core";
import { Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";

import "@react-pdf-viewer/core/lib/styles/index.css";
import { useFileMetadata } from "~/hooks/files/useFileMetadata";

const buildUrl = (token: string, path: string) => {
  if (!token || !path) return "";
  return `/file/${token}/${path}`;
};

const SanitizedPreview = ({ content }: { content: FileItem | null }) => {
  const { currentUser = "" } = useSimpleAuth();
  const contentUrl = buildUrl(currentUser as string, content?.url as string);

  const metadata = useFileMetadata({ fileId: content?.id as string });
  console.log({ metadata });

  return (
    <div className="my-4">
      <h1 className="font-semibold">File Preview</h1>
      <div className="max-w-[500px] w-full mx-auto">
        <div className=" mx-auto w-full h-[400px] overflow-auto">
          {content?.type === "application/pdf" && (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <Viewer
                fileUrl={contentUrl}
                defaultScale={SpecialZoomLevel.PageFit}
              />
            </Worker>
          )}
          {content?.type === "image/png" && (
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
