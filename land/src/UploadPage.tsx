import FileUpload from "@shandi/shared/src/FileUpload";
import { getAuthHeaders } from "./stores/UserStore";

export default function UploadPage() {
  return (
    <FileUpload
      onUploadFile={async (file) => {
        const res = await fetch(`/api/battles`, {
          method: "POST",
          body: file,
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          console.error("Failed to import file: ", await res.text());
          return;
        }
      }}
    />
  );
}
