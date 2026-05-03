import { useState } from 'react';
import { he } from '../i18n/he';
import type { Alert } from '../types/machine';

interface Props {
  alerts: Alert[];
  strings: { title: string; none: string };
}

const levelStyles: Record<Alert['level'], string> = {
  error: 'bg-rose-50   border-rose-300   text-rose-900',
  warn:  'bg-amber-50  border-amber-300  text-amber-900',
  info:  'bg-sky-50    border-sky-300    text-sky-900',
};

const levelIcon: Record<Alert['level'], string> = {
  error: '❌',
  warn:  '⚠️',
  info:  'ℹ️',
};

export default function AlertsPanel({ alerts, strings }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <section className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      {/* Header */}
      <div className={`px-4 py-2.5 font-semibold text-sm flex items-center gap-2 ${
        alerts.length === 0
          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white'
          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
      }`}>
        <span>{alerts.length === 0 ? '✔' : '⚠'}</span>
        <span>{strings.title}</span>
      </div>

      <div className="bg-white p-3">
        {alerts.length === 0 ? (
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
            {strings.none}
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-72 overflow-y-auto">
            {alerts.map((a) => {
              const hasDetails = a.details && a.details.length > 0;
              const expanded = expandedIds.has(a.id);
              return (
                <li key={a.id} className={`text-xs border rounded-xl overflow-hidden ${levelStyles[a.level]}`}>
                  <div className="flex items-start gap-1.5 px-3 py-2 leading-snug">
                    <span className="mt-px shrink-0">{levelIcon[a.level]}</span>
                    <span className="flex-1">{a.message}</span>
                    {hasDetails && (
                      <button
                        onClick={() => toggle(a.id)}
                        className="shrink-0 text-[10px] font-semibold underline underline-offset-2 opacity-70 hover:opacity-100 transition-opacity"
                      >
                        {expanded ? '▲' : '▼'} {he.buttons.seeWhy}
                      </button>
                    )}
                  </div>
                  {hasDetails && expanded && (
                    <ul className="border-t border-current/20 px-3 py-2 space-y-0.5 opacity-80">
                      {a.details!.map((d, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="shrink-0 mt-px">·</span>
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
