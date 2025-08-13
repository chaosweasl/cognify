interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Loading({ size = 'md', className = '' }: LoadingProps) {
  return (
    <div className={`loading loading-spinner loading-${size} ${className}`}></div>
  );
}