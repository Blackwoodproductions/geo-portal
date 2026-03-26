export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500 ${className}`} />
  );
}
