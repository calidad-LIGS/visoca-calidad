import {
  Document, Page, Text, View, StyleSheet, pdf,
} from "@react-pdf/renderer";

const C = {
  border: "#2E3347", dark: "#0F1117", primary: "#3B7DD8",
  text: "#1a1a1a", muted: "#555A6B", head: "#1A1D27",
};

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 9, color: C.text, fontFamily: "Helvetica" },
  headerBox: { borderWidth: 1, borderColor: C.border, marginBottom: 10 },
  headerTop: { backgroundColor: "#0F1117", color: "#fff", padding: 6, flexDirection: "row", justifyContent: "space-between" },
  logo: { fontSize: 14, fontWeight: "bold", color: "#3B7DD8" },
  metaRow: { flexDirection: "row", borderTopWidth: 1, borderColor: C.border },
  metaCell: { flex: 1, padding: 4, borderRightWidth: 1, borderColor: C.border },
  metaLabel: { fontSize: 7, color: C.muted },
  metaValue: { fontSize: 9 },
  sectionTitle: { fontSize: 11, fontWeight: "bold", marginTop: 10, marginBottom: 4 },
  intro: { marginBottom: 8, lineHeight: 1.4 },
  table: { borderWidth: 1, borderColor: C.border, marginTop: 4 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: C.border },
  th: { backgroundColor: "#E8EAF0", padding: 4, fontSize: 8, fontWeight: "bold", borderRightWidth: 1, borderColor: C.border },
  td: { padding: 4, fontSize: 8, borderRightWidth: 1, borderColor: C.border },
  cTipo: { width: "16%" }, cHall: { width: "34%" }, cComp: { width: "20%" },
  cFecha: { width: "12%" }, cResp: { width: "12%" }, cEst: { width: "16%" },
  subBox: { borderWidth: 1, borderColor: C.border, marginTop: 14, padding: 8 },
  sign: { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  signCol: { width: "45%" },
  signLine: { borderTopWidth: 1, borderColor: C.text, marginTop: 28, paddingTop: 4, fontSize: 8 },
  note: { marginTop: 10, fontSize: 7, color: C.muted },
});

export interface ActaData {
  codigo: string;
  empresaNombre: string;
  departamento: string;
  responsable: string;
  fecha: string;
  descripcion: string;
  aplicacion: string;
  version: string;
  hallazgos: {
    tipo: string; descripcion: string; responsable: string;
    compromiso: string; fechaCompromiso: string; estatus: string;
  }[];
}

const TIPO_LABEL: Record<string, string> = {
  nc_mayor: "NC Mayor", nc_menor: "NC Menor", oportunidad_mejora: "Oportunidad de mejora",
};

export function ActaDocument({ d }: { d: ActaData }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerBox}>
          <View style={s.headerTop}>
            <Text style={s.logo}>LIGS GROUP</Text>
            <Text>Acta de Resultados de Auditoría</Text>
          </View>
          <View style={s.metaRow}>
            <View style={s.metaCell}><Text style={s.metaLabel}>Formato</Text><Text style={s.metaValue}>Acta de resultados</Text></View>
            <View style={s.metaCell}><Text style={s.metaLabel}>Código</Text><Text style={s.metaValue}>LIGS-CAL-01-F03</Text></View>
            <View style={s.metaCell}><Text style={s.metaLabel}>Versión</Text><Text style={s.metaValue}>{d.version}</Text></View>
            <View style={[s.metaCell, { borderRightWidth: 0 }]}><Text style={s.metaLabel}>Aplicación</Text><Text style={s.metaValue}>{d.aplicacion}</Text></View>
          </View>
          <View style={s.metaRow}>
            <View style={s.metaCell}><Text style={s.metaLabel}>Departamento</Text><Text style={s.metaValue}>{d.departamento}</Text></View>
            <View style={s.metaCell}><Text style={s.metaLabel}>Responsable</Text><Text style={s.metaValue}>{d.responsable}</Text></View>
            <View style={[s.metaCell, { borderRightWidth: 0 }]}><Text style={s.metaLabel}>Fecha</Text><Text style={s.metaValue}>{d.fecha}</Text></View>
          </View>
        </View>

        <Text style={s.intro}>
          Derivado de la auditoría {d.codigo} realizada a {d.empresaNombre}, {d.descripcion}
        </Text>

        <Text style={s.sectionTitle}>Hallazgos</Text>
        <View style={s.table}>
          <View style={s.tr}>
            <Text style={[s.th, s.cTipo]}>Tipo observación</Text>
            <Text style={[s.th, s.cHall]}>Hallazgo</Text>
            <Text style={[s.th, s.cComp]}>Compromiso</Text>
            <Text style={[s.th, s.cFecha]}>F. Compromiso</Text>
            <Text style={[s.th, s.cResp]}>Responsable</Text>
            <Text style={[s.th, s.cEst, { borderRightWidth: 0 }]}>Estatus</Text>
          </View>
          {d.hallazgos.map((h, i) => (
            <View style={s.tr} key={i}>
              <Text style={[s.td, s.cTipo]}>{TIPO_LABEL[h.tipo] ?? h.tipo}</Text>
              <Text style={[s.td, s.cHall]}>{h.descripcion}</Text>
              <Text style={[s.td, s.cComp]}>{h.compromiso}</Text>
              <Text style={[s.td, s.cFecha]}>{h.fechaCompromiso}</Text>
              <Text style={[s.td, s.cResp]}>{h.responsable}</Text>
              <Text style={[s.td, s.cEst, { borderRightWidth: 0 }]}>{h.estatus}</Text>
            </View>
          ))}
          {d.hallazgos.length === 0 && (
            <View style={s.tr}><Text style={[s.td, { width: "100%", borderRightWidth: 0 }]}>Sin hallazgos registrados.</Text></View>
          )}
        </View>

        <View style={s.subBox}>
          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Subsanación de hallazgos</Text>
          <Text>Responsable: {d.responsable}    Fecha: {d.fecha}</Text>
          <Text style={{ marginTop: 6 }}>
            Mediante la presente queda declarada la subsanación de los hallazgos derivados de la auditoría,
            comprometiéndose el área a la implementación de las acciones correctivas señaladas.
          </Text>
        </View>

        <View style={s.sign}>
          <View style={s.signCol}>
            <Text style={s.signLine}>Nombre: Ing. Sousthy M. De la Cruz Gavilla</Text>
            <Text style={{ fontSize: 8 }}>Puesto: Jefe de Calidad</Text>
          </View>
          <View style={s.signCol}>
            <Text style={s.signLine}>Responsable del área</Text>
            <Text style={{ fontSize: 8 }}>{d.responsable}</Text>
          </View>
        </View>

        <Text style={s.note}>
          Nota: NC Mayor → 7 días hábiles. NC Menor / OM → antes de la siguiente auditoría.
        </Text>
      </Page>
    </Document>
  );
}

export async function generarActaBlob(d: ActaData): Promise<Blob> {
  return await pdf(<ActaDocument d={d} />).toBlob();
}
