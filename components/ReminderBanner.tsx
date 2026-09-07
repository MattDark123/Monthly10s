import { CloseIcon } from "./Icons";

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
    <div className="animate-fade-up mb-6 flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{body}</p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="-mr-1 -mt-1 shrink-0 p-1 text-muted"
      >
        <CloseIcon size={18} />
      </button>
    </div>
  );
}
