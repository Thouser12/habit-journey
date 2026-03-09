import { useState } from 'react';
import { useUserData } from '@/hooks/useUserData';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Stethoscope, LinkIcon, Unlink } from 'lucide-react';

const statusMap = {
  pending: { label: 'Pendente', variant: 'secondary' as const },
  accepted: { label: 'Aceito', variant: 'default' as const },
  rejected: { label: 'Recusado', variant: 'destructive' as const },
};

const DoctorPage = () => {
  const { user, requestDoctor, removeDoctor } = useUserData();
  const navigate = useNavigate();
  const [doctorId, setDoctorId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (doctorId.trim()) {
      requestDoctor(doctorId.trim());
      setDoctorId('');
    }
  };

  const conn = user.doctorConnection;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-6">
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
            {conn ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">{conn.doctorName}</p>
                    <p className="text-sm text-muted-foreground">ID: {conn.doctorId}</p>
                  </div>
                  <Badge variant={statusMap[conn.status].variant}>
                    {statusMap[conn.status].label}
                  </Badge>
                </div>
                <Button variant="outline" className="w-full" onClick={removeDoctor}>
                  <Unlink className="mr-2 h-4 w-4" />
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
                <Button type="submit" className="w-full" disabled={!doctorId.trim()}>
                  <LinkIcon className="mr-2 h-4 w-4" />
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
