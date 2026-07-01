export function Card({ className = "", children, ...props }) {
  return (
    <div className={`rounded-lg border bg-white text-slate-950 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className = "", children, ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
