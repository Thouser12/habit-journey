import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, ZoomIn } from 'lucide-react';

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  onCancel: () => void;
  onConfirm: (pixelCrop: Area) => Promise<void> | void;
}

export function ImageCropDialog({ open, imageSrc, onCancel, onConfirm }: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      await onConfirm(croppedAreaPixels);
    } finally {
      setProcessing(false);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    }
  };

  const handleCancel = () => {
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar foto</DialogTitle>
        </DialogHeader>

        <div className="relative h-80 w-full overflow-hidden rounded-lg bg-black">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="flex items-center gap-3 px-1">
          <ZoomIn className="h-4 w-4 text-muted-foreground" />
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.01}
            onValueChange={(v) => setZoom(v[0])}
            className="flex-1"
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Arraste pra mover, use o controle ou pinch pra ampliar
        </p>

        <DialogFooter className="flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={handleCancel} disabled={processing}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={processing || !croppedAreaPixels}>
            {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Usar foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
