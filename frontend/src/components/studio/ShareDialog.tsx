import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, Button, Input } from '@/components/ui';
import { useSceneStore } from '@/stores/sceneStore';

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShareDialog = ({ open, onOpenChange }: ShareDialogProps) => {
  const toHash = useSceneStore((s) => s.toHash);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (!open) return '';
    return `${window.location.origin}/studio#${toHash()}`;
  }, [open, toHash]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Share URL copied');
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Share scene" description="Anyone with this URL opens the exact scene.">
        <div className="space-y-3">
          <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
          <Button
            onClick={copy}
            className="w-full"
            leading={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          >
            {copied ? 'Copied' : 'Copy URL'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
