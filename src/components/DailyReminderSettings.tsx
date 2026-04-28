import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  ensurePermission,
  getReminderSettings,
  saveReminderSettings,
  scheduleDailyReminder,
  type ReminderSettings,
} from '@/lib/dailyReminder';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export function DailyReminderSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<ReminderSettings>(() => getReminderSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSettings(getReminderSettings());
  }, []);

  const apply = async (next: ReminderSettings) => {
    setSettings(next);
    saveReminderSettings(next);
    setSaving(true);
    try {
      if (next.enabled) {
        const granted = await ensurePermission();
        if (!granted) {
          toast({
            title: 'Permissao negada',
            description: 'Ative as notificacoes nas configuracoes do telefone para receber lembretes.',
            variant: 'destructive',
          });
          const reverted = { ...next, enabled: false };
          setSettings(reverted);
          saveReminderSettings(reverted);
          return;
        }
      }
      await scheduleDailyReminder(next);
      toast({
        title: next.enabled ? 'Lembrete agendado' : 'Lembrete desativado',
        description: next.enabled
          ? `Voce recebera um lembrete todo dia as ${formatTime(next.hour, next.minute)}.`
          : 'Nenhum lembrete sera enviado.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (enabled: boolean) => {
    void apply({ ...settings, enabled });
  };

  const handleHour = (hour: number) => {
    void apply({ ...settings, hour });
  };

  const handleMinute = (minute: number) => {
    void apply({ ...settings, minute });
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {settings.enabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-foreground">Lembrete diario</p>
              <p className="text-xs text-muted-foreground">Avisa pra registrar suas metas</p>
            </div>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={handleToggle}
            disabled={saving}
            aria-label="Ativar lembrete diario"
          />
        </div>

        {settings.enabled && (
          <div className="flex items-center gap-2 border-t border-border/60 pt-4">
            <span className="text-sm text-muted-foreground">Horario:</span>
            <div className="flex items-center gap-1.5">
              <TimeSelect value={settings.hour} options={HOURS} onChange={handleHour} disabled={saving} />
              <span className="text-foreground">:</span>
              <TimeSelect value={settings.minute} options={MINUTES} onChange={handleMinute} disabled={saving} />
            </div>
            {saving && <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TimeSelectProps {
  value: number;
  options: number[];
  onChange: (value: number) => void;
  disabled?: boolean;
}

function TimeSelect({ value, options, onChange, disabled }: TimeSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value, 10))}
      disabled={disabled}
      className="h-9 rounded-md border border-border/60 bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {String(opt).padStart(2, '0')}
        </option>
      ))}
    </select>
  );
}

function formatTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}
