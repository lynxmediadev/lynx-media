type AdminListEmptyStateProps = {
  message: string;
  className?: string;
};

export function AdminListEmptyState({ message, className = "" }: AdminListEmptyStateProps) {
  return <div className={`px-4 py-6 text-center text-xs text-muted-foreground ${className}`}>{message}</div>;
}

