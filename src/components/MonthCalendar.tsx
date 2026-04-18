import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthCalendarProps {
  /** Set of dates in YYYY-MM-DD format to highlight */
  highlightedDates: Set<string>;
  /** Tailwind classes for highlighted cell */
  highlightClassName?: string;
}

const weekLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function MonthCalendar({
  highlightedDates,
  highlightClassName = 'bg-primary text-primary-foreground',
}: MonthCalendarProps) {
  const [month, setMonth] = useState(new Date());
  const today = new Date();

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setMonth(subMonths(month, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold capitalize text-foreground">
          {format(month, "MMMM 'de' yyyy", { locale: ptBR })}
        </span>
        <button
          onClick={() => setMonth(addMonths(month, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
          aria-label="Próximo mes"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center">
        {weekLabels.map((label, i) => (
          <span key={i} className="text-[10px] font-semibold uppercase text-muted-foreground">
            {label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          const isHighlighted = highlightedDates.has(key);

          return (
            <div
              key={key}
              className={`relative flex aspect-square items-center justify-center rounded-md text-xs transition-colors ${
                !isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'
              } ${isHighlighted ? highlightClassName : ''} ${
                isToday && !isHighlighted ? 'ring-1 ring-primary' : ''
              }`}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
}
