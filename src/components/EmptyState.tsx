import { BookEmptyIcon } from "./icons";

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-16 flex flex-col items-center gap-6 md:mt-[120px]">
      <BookEmptyIcon className="size-20" />
      <p className="text-caption text-text-secondary">{message}</p>
    </div>
  );
}
