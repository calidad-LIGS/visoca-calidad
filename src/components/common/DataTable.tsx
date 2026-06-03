import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataTable({
  headers,
  children,
  empty,
  isEmpty,
}: {
  headers: ReactNode[];
  children: ReactNode;
  empty?: string;
  isEmpty?: boolean;
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
          {isEmpty ? (
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
