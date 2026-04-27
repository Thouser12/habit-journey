import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Stethoscope, LinkIcon, Unlink, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const statusMap = {
  pending: { label: 'Pendente', variant: 'secondary' as const },
  accepted: { label: 'Aceito', variant: 'default' as const },
  rejected: { label: 'Recusado', variant: 'destructive' as const },
};

interface DoctorConnection {
  id: string;
  doctor_id: string;
  doctor_name: string;
  status: string;
  custom_goals: string[] | null;
}

const DoctorPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [doctorId, setDoctorId] = useState('');
  const [conn, setConn] = useState<DoctorConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchConnection();
  }, [user]);

  const fetchConnection = async () => {
    const { data, error } = await supabase
      .from('doctor_connections')
      .select('*')
      .eq('user_id', user!.id)
      .maybeSingle();

    if (!error && data) {
      setConn(data as DoctorConnection);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorId.trim() || !user) return;

    setSubmitting(true);

    // Look up the doctor by their code
    const { data: doctor, error: lookupError } = await supabase
      .from('doctor_profiles')
      .select('id, name, doctor_code')
      .eq('doctor_code', doctorId.trim().toUpperCase())
      .maybeSingle();

    if (lookupError || !doctor) {
      toast({ title: 'Erro', description: 'Código de médico não encontrado. Verifique e tente novamente.', variant: 'destructive' });
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('doctor_connections').insert({
      user_id: user.id,
      doctor_id: doctor.doctor_code,
      doctor_user_id: doctor.id,
      doctor_name: doctor.name,
      status: 'pending',
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setDoctorId('');
      await fetchConnection();
      toast({ title: 'Solicitação enviada' });
    }
    setSubmitting(false);
  };

  const handleRemove = async () => {
    if (!conn) return;
    setSubmitting(true);
    const { error } = await supabase
      .from('doctor_connections')
      .delete()
      .eq('id', conn.id);

    if (!error) {
      setConn(null);
      toast({ title: 'Vínculo removido' });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 pb-safe-24 pt-safe-6">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Conexão com Médico</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-5 w-5" />
              Vincular a um Médico
            </CardTitle>
            <CardDescription>
              Ao se vincular a um médico, suas metas podem ser personalizadas de acordo com seu tratamento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conn ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">Dr. {conn.doctor_name}</p>
                    <p className="text-sm text-muted-foreground">ID: {conn.doctor_id}</p>
                  </div>
                  <Badge variant={statusMap[conn.status as keyof typeof statusMap]?.variant ?? 'secondary'}>
                    {statusMap[conn.status as keyof typeof statusMap]?.label ?? conn.status}
                  </Badge>
                </div>
                <Button variant="outline" className="w-full" onClick={handleRemove} disabled={submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlink className="mr-2 h-4 w-4" />}
                  Remover Vínculo
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="doctorId">Doctor ID</Label>
                  <Input
                    id="doctorId"
                    placeholder="Digite o Doctor ID"
                    value={doctorId}
                    onChange={(e) => setDoctorId(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={!doctorId.trim() || submitting}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
                  Solicitar Vínculo
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorPage;
