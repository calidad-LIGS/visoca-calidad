import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page, pageSize, total, onPageChange, noun = "registros",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
  noun?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>{total} {noun}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline" size="sm"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
        </Button>
        <span className="whitespace-nowrap font-display">Página {page + 1} de {totalPages}</span>
        <Button
          variant="outline" size="sm"
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
