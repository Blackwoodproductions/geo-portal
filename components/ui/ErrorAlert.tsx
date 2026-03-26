export function ErrorAlert({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm ${className}`}>
      {message}
    </div>
  );
}
