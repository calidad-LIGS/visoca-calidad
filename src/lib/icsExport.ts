export interface IcsEvento {
  id: string;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio: string;
  fecha_fin?: string | null;
  invitados_email?: string[] | null;
}

function padDate(s: string) {
  return s.replace(/[-:]/g, "").slice(0, 8);
}

/**
 * Construye un archivo iCalendar (.ics) a partir de uno o varios eventos.
 * Incluye líneas ATTENDEE por cada correo en `invitados_email`, de modo que
 * al importar el .ics en Google Calendar / Outlook se envíen invitaciones.
 */
export function buildIcs(eventos: IcsEvento[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//VISOCA-Calidad//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
  ];
  eventos.forEach((e) => {
    const start = padDate(e.fecha_inicio);
    const end = e.fecha_fin ? padDate(e.fecha_fin) : start;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@visoca`,
      `DTSTART;VALUE=DATE:${start}`,
      `DTEND;VALUE=DATE:${end}`,
      `SUMMARY:${(e.titulo || "").replace(/\n/g, " ")}`,
    );
    if (e.descripcion) {
      lines.push(`DESCRIPTION:${e.descripcion.replace(/\n/g, " ")}`);
    }
    (e.invitados_email ?? []).forEach((email) => {
      if (email) lines.push(`ATTENDEE;CN=${email};RSVP=TRUE:MAILTO:${email}`);
    });
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
