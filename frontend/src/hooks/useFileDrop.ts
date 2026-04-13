import { useEffect, useState } from 'react';

export const useFileDrop = (onFile: (file: File) => void) => {
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      setDragOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget) return;
      setDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer?.files[0];
      if (file) onFile(file);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [onFile]);

  return dragOver;
};
