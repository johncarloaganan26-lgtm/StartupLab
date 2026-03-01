'use client';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function formatValue(value: unknown) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const preferredOrder = [
  'eventTitle',
  'eventId',
  'eventDate',
  'eventTime',
  'eventLocation',
  'status',
  'updates',
  'title',
] as const;

export function AuditDetails(props: {
  summary: string;
  action: string;
  tone: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  details: string | null;
  detailsJson: unknown | null;
}) {
  const { summary, action, tone, details, detailsJson } = props;

  const toneBadgeClass =
    tone === 'success'
      ? 'border-blue-700 bg-blue-600 text-white'
      : tone === 'info'
      ? 'border-sky-700 bg-sky-600 text-white'
      : tone === 'warning'
      ? 'border-amber-800 bg-amber-600 text-white'
      : tone === 'danger'
      ? 'border-rose-800 bg-rose-600 text-white'
      : 'border-border bg-foreground text-background';

  const toneAccentClass =
    tone === 'success'
      ? 'border-l-blue-500 bg-blue-500/5'
      : tone === 'info'
      ? 'border-l-sky-500 bg-sky-500/5'
      : tone === 'warning'
      ? 'border-l-amber-500 bg-amber-500/5'
      : tone === 'danger'
      ? 'border-l-rose-500 bg-rose-500/5'
      : 'border-l-border bg-muted/10';

  const record = isRecord(detailsJson) ? detailsJson : null;
  const actorRole = record?.actorRole && typeof record.actorRole === 'string' ? record.actorRole : null;

  const entries = record
    ? Object.entries(record).filter(([key]) => key !== 'actorRole')
    : [];

  const ordered = [
    ...preferredOrder.flatMap((k) => entries.filter(([key]) => key === k)),
    ...entries.filter(([key]) => !preferredOrder.includes(key as any)),
  ].slice(0, 8);

  return (
    <div className={`space-y-2 border-l-4 pl-3 py-1 ${toneAccentClass}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] uppercase tracking-widest ${toneBadgeClass}`}>
          {action}
        </span>
        {actorRole && (
          <span className="inline-flex items-center rounded-sm border border-border bg-card px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
            {actorRole}
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-foreground">{summary}</p>

      {ordered.length > 0 ? (
        <dl className="grid gap-x-4 gap-y-1 md:grid-cols-2">
          {ordered.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2">
              <dt className="text-[11px] uppercase tracking-widest text-muted-foreground min-w-[96px]">
                {key}
              </dt>
              <dd className="text-xs text-foreground break-words">{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words max-w-[520px]">
          {details ?? '-'}
        </pre>
      )}
    </div>
  );
}
