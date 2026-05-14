import { cn } from "@/lib/utils";

const MAX_TABLE_CELL_TEXT_LENGTH = 50;

export function TableCellText({
  children,
  className,
}: {
  children: string | number | null | undefined;
  className?: string;
}) {
  const value = children === null || children === undefined ? "-" : String(children);
  const displayValue =
    value.length > MAX_TABLE_CELL_TEXT_LENGTH
      ? `${value.slice(0, MAX_TABLE_CELL_TEXT_LENGTH)}...`
      : value;

  return (
    <span
      className={cn("block max-w-[24rem] truncate", className)}
      title={value}
    >
      {displayValue}
    </span>
  );
}
