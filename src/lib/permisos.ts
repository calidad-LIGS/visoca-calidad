import { useAuth } from "@/components/auth/AuthProvider";
import type { AppRole } from "@/lib/roles";

/**
 * Permisos por rol (Fase 8).
 * gerente_calidad: todo
 * jefe_calidad: crear/editar/exportar todo excepto gestión de usuarios y eliminar
 * analista: crear/editar registros, NO exportar actas, NO finalizar
 * auditor_interno: crear/editar auditorías y hallazgos, ver el resto
 */
export interface Permisos {
  rol: AppRole | null;
  // catálogos / usuarios
  gestionarUsuarios: boolean;
  editarCatalogos: boolean;
  // documentos
  crearDocumento: boolean;
  editarDocumento: boolean;
  eliminarDocumento: boolean;
  // pnc
  crearPnc: boolean;
  editarPnc: boolean;
  finalizarPnc: boolean;
  // auditorias
  crearAuditoria: boolean;
  editarAuditoria: boolean;
  cerrarAuditoria: boolean;
  exportarActa: boolean;
  // proyectos
  crearProyecto: boolean;
  editarProyecto: boolean;
  // export
  exportar: boolean;
}

export function usePermisos(): Permisos {
  const { roles } = useAuth();
  const rol: AppRole | null = roles[0] ?? null;
  const is = (r: AppRole) => roles.includes(r);
  const gerente = is("gerente_calidad");
  const jefe = is("jefe_calidad");
  const analista = is("analista");
  const auditor = is("auditor_interno");

  // Si no se cargaron roles aún (array vacío con sesión activa),
  // asumir permisos mínimos de analista para que la UI no quede vacía.
  const sinRoles = roles.length === 0;

  return {
    rol,
    gestionarUsuarios: gerente,
    editarCatalogos: gerente || jefe,
    crearDocumento: gerente || jefe || analista,
    editarDocumento: gerente || jefe || analista || sinRoles,
    eliminarDocumento: gerente,
    crearPnc: gerente || jefe || auditor,
    editarPnc: gerente || jefe || analista || auditor || sinRoles,
    finalizarPnc: gerente || jefe,
    crearAuditoria: gerente || jefe || auditor || analista,
    editarAuditoria: gerente || jefe || auditor || analista || sinRoles,
    cerrarAuditoria: gerente || jefe,
    exportarActa: gerente || jefe,
    crearProyecto: gerente || jefe || analista || sinRoles,
    editarProyecto: gerente || jefe || analista || sinRoles,
    exportar: gerente || jefe,
  };
}
