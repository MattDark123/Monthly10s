export default function ReminderBanner({
  title,
  body,
  onDismiss,
}: {
  title: string;
  body: string;
  onDismiss: () => void;
}) {
  return (
    <div className="animate-fade-in mb-4 flex items-start gap-3 rounded-2xl bg-coral/10 p-4">
      <span className="text-xl">✨</span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink/70">{body}</p>
      </div>
      <button onClick={onDismiss} className="shrink-0 text-lg text-ink/40" aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
