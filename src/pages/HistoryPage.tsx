import { useUserData } from '@/hooks/useUserData';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LevelBadge from '@/components/LevelBadge';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { LEVEL_LABELS } from '@/data/goals';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const statusConfig = {
  promoted: { label: 'Promovido ⬆️', icon: TrendingUp, variant: 'default' as const },
  maintained: { label: 'Manteve ➡️', icon: Minus, variant: 'secondary' as const },
  demoted: { label: 'Rebaixado ⬇️', icon: TrendingDown, variant: 'destructive' as const },
};

const HistoryPage = () => {
  const { user, loading } = useUserData();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const history = [...user.weeklyHistory].reverse();

  const chartData = user.weeklyHistory.map((w, i) => ({
    name: `S${i + 1}`,
    percentual: w.percentage,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 pb-safe-24 pt-safe-6">
        <div className="mb-6 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Histórico Semanal</h1>
        </div>

        {history.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum ciclo semanal concluído ainda.</p>
              <p className="mt-2 text-sm text-muted-foreground">Complete 7 dias para ver seu primeiro resultado.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Chart */}
            {chartData.length > 1 && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Evolução</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis domain={[0, 100]} className="text-xs fill-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="percentual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Week list */}
            <div className="space-y-3">
              {history.map((week, i) => {
                const config = statusConfig[week.status];
                return (
                  <Card key={i}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">
                          {week.weekStart} → {week.weekEnd}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{LEVEL_LABELS[week.levelBefore]}</span>
                          <span>→</span>
                          <span>{LEVEL_LABELS[week.levelAfter]}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-lg font-bold text-foreground">{week.percentage}%</span>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
