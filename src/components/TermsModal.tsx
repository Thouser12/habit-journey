import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck } from 'lucide-react';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
}

const TermsModal = ({ open, onAccept }: TermsModalProps) => {
  return (
    <Dialog open={open}>
        <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader className="items-center text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl">Aviso Importante</DialogTitle>
            <DialogDescription className="mt-4 text-base leading-relaxed">
              Este aplicativo <strong>não substitui consulta médica presencial</strong>.
              <br /><br />
              As metas genéricas possuem caráter <strong>educativo e comportamental</strong>, e são
              projetadas para apoiar a construção de hábitos saudáveis.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button onClick={onAccept} className="w-full" size="lg">
              ☑️ Entendi
            </Button>
          </div>
        </DialogContent>
    </Dialog>
  );
};

export default TermsModal;
