import { useState } from "react";

export default function FileUpload({
  onUploadFile,
}: {
  onUploadFile: (file: File) => void;
}) {
  const [_, setDragging] = useState(false);

  const handleDrag = (e: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragging(true);
    } else if (e.type === "dragleave") {
      setDragging(false);
    }
  };

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.dataTransfer.files) {
      return;
    }

    for (const file of e.dataTransfer.files) {
      onUploadFile(file);
    }
  };

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className="w-full h-full min-w-64 min-h-64 bg-gray-700 p-2 text-center text-2xl text-bold text-gray-200"
    >
      <div className="m-auto">Drag File Here</div>
    </div>
  );
}
