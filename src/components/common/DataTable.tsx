import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function DataTable({
  headers,
  children,
  empty,
  isEmpty,
  isLoading,
}: {
  headers: ReactNode[];
  children: ReactNode;
  empty?: string;
  isEmpty?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div className="max-h-[65vh] overflow-auto rounded-lg border border-border">
      <table className="w-full border-collapse text-sm [&_tbody_tr:nth-child(even)]:bg-card/60">
        <thead className="sticky top-0 z-10 bg-elevated">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, r) => (
              <tr key={r}>
                {headers.map((_, c) => (
                  <Td key={c}>
                    <Skeleton className="h-4 w-full max-w-[8rem]" />
                  </Td>
                ))}
              </tr>
            ))
          ) : isEmpty ? (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-12 text-center text-sm text-muted-foreground"
              >
                {empty ?? "Sin registros."}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Tr({
  children,
  onClick,
  active,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      data-active={active ? "" : undefined}
      className={cn(
        onClick && "cursor-pointer transition-colors hover:!bg-elevated",
        active && "border-l-2 border-primary !bg-primary/10",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <td className={cn("border-t border-border px-4 py-3 align-middle", className)}>
      {children}
    </td>
  );
}
