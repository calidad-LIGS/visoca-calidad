import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

const C = {
  headerLabel: "#D9D9D9",
  ncMayor: "#FFC7CE",
  ncMenor: "#FFEB9C",
  omBg: "#C6EFCE",
  tablHeader: "#D9D9D9",
  border: "#AAAAAA",
  text: "#000000",
  muted: "#555555",
};

const s = StyleSheet.create({
  page: { paddingTop: 20, paddingBottom: 20, paddingLeft: 25, paddingRight: 25, fontSize: 8, color: "#000", fontFamily: "Helvetica" },
  orgName: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6, textAlign: "center" },
  headerTable: { borderWidth: 1, borderColor: "#AAAAAA", marginBottom: 6 },
  headerRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#AAAAAA" },
  headerRowLast: { flexDirection: "row" },
  hLabelCell: { backgroundColor: "#D9D9D9", padding: 3, borderRightWidth: 1, borderColor: "#AAAAAA", fontFamily: "Helvetica-Bold", fontSize: 8 },
  hValueCell: { padding: 3, borderRightWidth: 1, borderColor: "#AAAAAA", fontSize: 8 },
  hValueLast: { padding: 3, fontSize: 8 },
  infoRow: { flexDirection: "row", marginTop: 6, marginBottom: 4 },
  infoLabel: { fontFamily: "Helvetica-Bold", fontSize: 8, width: 75 },
  infoValue: { fontSize: 8, flex: 1, borderBottomWidth: 0.5, borderColor: "#AAAAAA" },
  infoSpacer: { width: 12 },
  intro: { fontSize: 8, marginBottom: 6, lineHeight: 1.4 },
  table: { borderWidth: 1, borderColor: "#AAAAAA", marginBottom: 8 },
  tHeaderRow: { flexDirection: "row", backgroundColor: "#D9D9D9", borderBottomWidth: 1, borderColor: "#AAAAAA" },
  tRow: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#AAAAAA", minHeight: 20 },
  tRowMayor: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#AAAAAA", minHeight: 20, backgroundColor: "#FFC7CE" },
  tRowMenor: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#AAAAAA", minHeight: 20, backgroundColor: "#FFEB9C" },
  tRowOM: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#AAAAAA", minHeight: 20, backgroundColor: "#C6EFCE" },
  th: { fontFamily: "Helvetica-Bold", fontSize: 7.5, padding: 3, borderRightWidth: 0.5, borderColor: "#AAAAAA" },
  thLast: { fontFamily: "Helvetica-Bold", fontSize: 7.5, padding: 3 },
  td: { fontSize: 7.5, padding: 3, borderRightWidth: 0.5, borderColor: "#AAAAAA" },
  tdLast: { fontSize: 7.5, padding: 3 },
  colTipo: { width: "16%" }, colHall: { width: "32%" }, colComp: { width: "20%" },
  colFecha: { width: "12%" }, colResp: { width: "11%" }, colEst: { width: "9%" },
  subsanBox: { borderWidth: 1, borderColor: "#AAAAAA", marginBottom: 8, padding: 6, backgroundColor: "#F2F2F2" },
  subsanTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, marginBottom: 4 },
  subsanText: { fontSize: 8, marginTop: 4, lineHeight: 1.4 },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  signBox: { width: "45%" },
  signLine: { borderTopWidth: 0.5, borderColor: "#000", marginTop: 24, paddingTop: 3, fontSize: 7.5 },
  note: { marginTop: 8, fontSize: 7, color: "#555555", lineHeight: 1.4 },
});

export interface HallazgoActa {
  tipo: "nc_mayor" | "nc_menor" | "oportunidad_mejora";
  descripcion: string;
  compromiso: string;
  subsanacion?: string;
  fechaCompromiso: string;
  responsable: string;
  estatus: string;
}

export interface ActaData {
  codigo: string;
  version: string;
  entradaVigor: string;
  ultimaRevision: string;
  aplicacion: string;
  codigoAuditoria: string;
  descripcionAuditoria: string;
  departamento: string;
  responsable: string;
  fecha: string;
  subsanacion?: string;
  hallazgos: HallazgoActa[];
  orgNombre: string;
  orgLogoUrl: string | null;
  jefeCalidadNombre: string;
  jefeCalidadPuesto: string;
}

const TIPO_LABEL: Record<string, string> = {
  nc_mayor: "No conformidad mayor",
  nc_menor: "No conformidad menor",
  oportunidad_mejora: "Oportunidad de mejora",
};

function getRowStyle(tipo: string) {
  if (tipo === "nc_mayor") return s.tRowMayor;
  if (tipo === "nc_menor") return s.tRowMenor;
  return s.tRowOM;
}

export function ActaDocument({ d }: { d: ActaData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.orgName}>{d.orgNombre.toUpperCase()}</Text>

        <View style={s.headerTable}>
          <View style={s.headerRow}>
            <Text style={[s.hLabelCell, { width: "15%" }]}>Formato</Text>
            <Text style={[s.hValueCell, { flex: 1 }]}>Acta de resultados</Text>
            <Text style={[s.hLabelCell, { width: "12%" }]}>Código</Text>
            <Text style={[s.hValueLast, { width: "20%" }]}>{d.codigo}</Text>
          </View>
          <View style={s.headerRow}>
            <Text style={[s.hLabelCell, { width: "15%" }]}>Departamento</Text>
            <Text style={[s.hValueCell, { flex: 1 }]}>Calidad</Text>
            <Text style={[s.hLabelCell, { width: "12%" }]}>Versión</Text>
            <Text style={[s.hValueLast, { width: "20%" }]}>{d.version}</Text>
          </View>
          <View style={s.headerRow}>
            <Text style={[s.hLabelCell, { width: "15%" }]}>Entrada en vigor</Text>
            <Text style={[s.hValueCell, { flex: 1 }]}>{d.entradaVigor}</Text>
            <Text style={[s.hLabelCell, { width: "12%" }]}>Última Revisión</Text>
            <Text style={[s.hValueLast, { width: "20%" }]}>{d.ultimaRevision}</Text>
          </View>
          <View style={s.headerRowLast}>
            <Text style={[s.hLabelCell, { width: "15%" }]}>Aplicación</Text>
            <Text style={[s.hValueLast, { flex: 1 }]}>{d.aplicacion}</Text>
          </View>
        </View>

        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Departamento:</Text>
          <Text style={s.infoValue}>{d.departamento}</Text>
          <View style={s.infoSpacer} />
          <Text style={s.infoLabel}>Responsable:</Text>
          <Text style={s.infoValue}>{d.responsable}</Text>
          <View style={s.infoSpacer} />
          <Text style={s.infoLabel}>Fecha:</Text>
          <Text style={s.infoValue}>{d.fecha}</Text>
        </View>

        <Text style={s.intro}>
          Derivado de la auditoría {d.codigoAuditoria} — {d.descripcionAuditoria}, se obtuvieron las siguientes observaciones para el departamento de {d.departamento}:
        </Text>

        <View style={s.table}>
          <View style={s.tHeaderRow}>
            <Text style={[s.th, s.colTipo]}>Tipo de observación</Text>
            <Text style={[s.th, s.colHall]}>Hallazgo</Text>
            <Text style={[s.th, s.colComp]}>Compromiso derivado</Text>
            <Text style={[s.th, s.colFecha]}>Fecha compromiso</Text>
            <Text style={[s.th, s.colResp]}>Responsable</Text>
            <Text style={[s.thLast, s.colEst]}>Estatus</Text>
          </View>
          {d.hallazgos.length === 0 ? (
            <View style={s.tRow}>
              <Text style={[s.td, { width: "100%", borderRightWidth: 0 }]}>Sin hallazgos.</Text>
            </View>
          ) : (
            d.hallazgos.map((h, i) => (
              <View style={getRowStyle(h.tipo)} key={i}>
                <Text style={[s.td, s.colTipo]}>{TIPO_LABEL[h.tipo] ?? h.tipo}</Text>
                <Text style={[s.td, s.colHall]}>{h.descripcion}</Text>
                <Text style={[s.td, s.colComp]}>{h.compromiso}</Text>
                <Text style={[s.td, s.colFecha]}>{h.fechaCompromiso}</Text>
                <Text style={[s.td, s.colResp]}>{h.responsable}</Text>
                <Text style={[s.tdLast, s.colEst]}>{h.estatus}</Text>
              </View>
            ))
          )}
        </View>

        <View style={s.subsanBox}>
          <Text style={s.subsanTitle}>Subsanación de los hallazgos señalados en la auditoría interna</Text>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Responsable:</Text>
            <Text style={[s.infoValue, { flex: 1 }]}>{d.responsable}</Text>
            <View style={s.infoSpacer} />
            <Text style={s.infoLabel}>Fecha:</Text>
            <Text style={[s.infoValue, { width: "25%" }]}>{d.fecha}</Text>
          </View>
          <Text style={s.subsanText}>
            Mediante la presente queda declarada la subsanación de las No conformidades marcadas durante la auditoría interna realizada al departamento de {d.departamento}.
          </Text>
        </View>

        <View style={s.signRow}>
          <View style={s.signBox}>
            <Text style={s.signLine}>Nombre: {d.jefeCalidadNombre}</Text>
            <Text style={{ fontSize: 7.5 }}>Puesto: {d.jefeCalidadPuesto}</Text>
          </View>
          <View style={s.signBox}>
            <Text style={s.signLine}>Nombre: {d.responsable}</Text>
            <Text style={{ fontSize: 7.5 }}>Responsable del área — {d.departamento}</Text>
          </View>
        </View>

        <Text style={s.note}>
          Nota: Para las no conformidades mayores se establece un tiempo límite de 7 días hábiles para el envío de las evidencias de subsanación. En el caso de las no conformidades menores y las oportunidades de mejora se establece el cierre antes de la siguiente fecha de auditoría interna programada donde se revisará la evidencia.
        </Text>
      </Page>
    </Document>
  );
}

export async function generarActaBlob(d: ActaData): Promise<Blob> {
  return await pdf(<ActaDocument d={d} />).toBlob();
}
