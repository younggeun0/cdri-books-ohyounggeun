export function ResultCount({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <p className="text-caption mt-6 flex gap-4">
      <span>{label}</span>
      <span>
        총 <span className="text-primary">{count}</span>건
      </span>
    </p>
  );
}
