import { Download, Image as ImageIcon, Box, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, Button } from '@/components/ui';
import { useSceneStore } from '@/stores/sceneStore';

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const glbUrl = useSceneStore((s) => s.generation.glbUrl);
  const splatUrl = useSceneStore((s) => s.generation.splatUrl);

  const download = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`Exporting ${name}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Export scene" description="Download the generated assets.">
        <div className="grid grid-cols-1 gap-2 p-5 sm:grid-cols-2">
          <Button
            variant="secondary"
            leading={<Box className="h-4 w-4" />}
            disabled={!glbUrl}
            onClick={() => glbUrl && download(glbUrl, '3dme-mesh.glb')}
          >
            GLB mesh
          </Button>
          <Button
            variant="secondary"
            leading={<Sparkles className="h-4 w-4" />}
            disabled={!splatUrl}
            onClick={() => splatUrl && download(splatUrl, '3dme-splat.ply')}
          >
            PLY splat
          </Button>
          <Button variant="secondary" leading={<ImageIcon className="h-4 w-4" />} disabled>
            PNG snapshot (soon)
          </Button>
          <Button variant="secondary" leading={<Download className="h-4 w-4" />} disabled>
            MP4 video (soon)
          </Button>
        </div>
        {!glbUrl && !splatUrl && (
          <p className="px-5 pb-5 text-2xs text-white/50">
            Generate a scene first to unlock downloads.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};
