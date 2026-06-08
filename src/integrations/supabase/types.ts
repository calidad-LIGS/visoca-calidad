export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      actividades: {
        Row: {
          agregar_calendario: boolean | null
          avance: number | null
          correo_invitado: string | null
          created_at: string
          descripcion: string | null
          duracion_real_dias: number | null
          estatus: string
          fecha_fin_plan: string | null
          fecha_fin_real: string | null
          fecha_inicio_plan: string | null
          fecha_inicio_real: string | null
          id: string
          nombre: string
          orden: number | null
          proyecto_id: string
          responsable_email: string | null
          responsable_nombre: string | null
          responsable_usuario_id: string | null
          updated_at: string
        }
        Insert: {
          agregar_calendario?: boolean | null
          avance?: number | null
          correo_invitado?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_real_dias?: number | null
          estatus?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          id?: string
          nombre: string
          orden?: number | null
          proyecto_id: string
          responsable_email?: string | null
          responsable_nombre?: string | null
          responsable_usuario_id?: string | null
          updated_at?: string
        }
        Update: {
          agregar_calendario?: boolean | null
          avance?: number | null
          correo_invitado?: string | null
          created_at?: string
          descripcion?: string | null
          duracion_real_dias?: number | null
          estatus?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          id?: string
          nombre?: string
          orden?: number | null
          proyecto_id?: string
          responsable_email?: string | null
          responsable_nombre?: string | null
          responsable_usuario_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actividades_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actividades_responsable_usuario_id_fkey"
            columns: ["responsable_usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      area_empresas: {
        Row: {
          area_id: string
          empresa_id: string
          id: string
        }
        Insert: {
          area_id: string
          empresa_id: string
          id?: string
        }
        Update: {
          area_id?: string
          empresa_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_empresas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "area_empresas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      auditoria_actas: {
        Row: {
          auditoria_id: string
          contenido_json: Json | null
          created_at: string
          departamento: string | null
          fecha_acta: string | null
          generado_por: string | null
          id: string
          pdf_url: string | null
          responsable_nombre: string | null
          tipo_generacion: string | null
        }
        Insert: {
          auditoria_id: string
          contenido_json?: Json | null
          created_at?: string
          departamento?: string | null
          fecha_acta?: string | null
          generado_por?: string | null
          id?: string
          pdf_url?: string | null
          responsable_nombre?: string | null
          tipo_generacion?: string | null
        }
        Update: {
          auditoria_id?: string
          contenido_json?: Json | null
          created_at?: string
          departamento?: string | null
          fecha_acta?: string | null
          generado_por?: string | null
          id?: string
          pdf_url?: string | null
          responsable_nombre?: string | null
          tipo_generacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_actas_auditoria_id_fkey"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "auditorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_actas_generado_por_fkey"
            columns: ["generado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria_hallazgos: {
        Row: {
          area_id: string | null
          auditoria_id: string
          cerrado: boolean | null
          compromiso: string | null
          created_at: string
          departamento: string | null
          descripcion: string
          estatus: string
          fecha_compromiso: string | null
          fecha_subsanacion: string | null
          id: string
          plan_mejora_url: string | null
          pnc_id: string | null
          proceso_documento_id: string | null
          proceso_texto: string | null
          responsable_nombre: string | null
          responsable_usuario_id: string | null
          subsanacion: string | null
          tipo: string
        }
        Insert: {
          area_id?: string | null
          auditoria_id: string
          cerrado?: boolean | null
          compromiso?: string | null
          created_at?: string
          departamento?: string | null
          descripcion: string
          estatus?: string
          fecha_compromiso?: string | null
          fecha_subsanacion?: string | null
          id?: string
          plan_mejora_url?: string | null
          pnc_id?: string | null
          proceso_documento_id?: string | null
          proceso_texto?: string | null
          responsable_nombre?: string | null
          responsable_usuario_id?: string | null
          subsanacion?: string | null
          tipo: string
        }
        Update: {
          area_id?: string | null
          auditoria_id?: string
          cerrado?: boolean | null
          compromiso?: string | null
          created_at?: string
          departamento?: string | null
          descripcion?: string
          estatus?: string
          fecha_compromiso?: string | null
          fecha_subsanacion?: string | null
          id?: string
          plan_mejora_url?: string | null
          pnc_id?: string | null
          proceso_documento_id?: string | null
          proceso_texto?: string | null
          responsable_nombre?: string | null
          responsable_usuario_id?: string | null
          subsanacion?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_hallazgos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_hallazgos_auditoria_id_fkey"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "auditorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_hallazgos_pnc_id_fkey"
            columns: ["pnc_id"]
            isOneToOne: false
            referencedRelation: "pnc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_hallazgos_proceso_documento_id_fkey"
            columns: ["proceso_documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditoria_hallazgos_responsable_usuario_id_fkey"
            columns: ["responsable_usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      auditorias: {
        Row: {
          anio: number
          areas_auditadas: string[] | null
          auditor_lider_id: string | null
          certificacion: string | null
          certificacion_otra: string | null
          codigo_auditoria: string
          creado_por: string | null
          created_at: string
          empresa_ids: string[] | null
          estatus: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          informe_drive_url: string | null
          informe_url: string | null
          modalidad: string | null
          notas: string | null
          numero_auditoria: number
          tipo: string
          updated_at: string
        }
        Insert: {
          anio: number
          areas_auditadas?: string[] | null
          auditor_lider_id?: string | null
          certificacion?: string | null
          certificacion_otra?: string | null
          codigo_auditoria: string
          creado_por?: string | null
          created_at?: string
          empresa_ids?: string[] | null
          estatus?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          informe_drive_url?: string | null
          informe_url?: string | null
          modalidad?: string | null
          notas?: string | null
          numero_auditoria: number
          tipo: string
          updated_at?: string
        }
        Update: {
          anio?: number
          areas_auditadas?: string[] | null
          auditor_lider_id?: string | null
          certificacion?: string | null
          certificacion_otra?: string | null
          codigo_auditoria?: string
          creado_por?: string | null
          created_at?: string
          empresa_ids?: string[] | null
          estatus?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          informe_drive_url?: string | null
          informe_url?: string | null
          modalidad?: string | null
          notas?: string | null
          numero_auditoria?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auditorias_auditor_lider_id_fkey"
            columns: ["auditor_lider_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auditorias_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      busquedas_ia: {
        Row: {
          created_at: string
          id: string
          query: string
          resultado_json: Json | null
          usuario_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          resultado_json?: Json | null
          usuario_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          resultado_json?: Json | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "busquedas_ia_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      cargos: {
        Row: {
          activo: boolean
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      configuracion_alertas: {
        Row: {
          dias_alerta_documentos_sin_revision: number
          dias_alerta_pnc: number
          dias_sin_auditoria: number
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          dias_alerta_documentos_sin_revision?: number
          dias_alerta_pnc?: number
          dias_sin_auditoria?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          dias_alerta_documentos_sin_revision?: number
          dias_alerta_pnc?: number
          dias_sin_auditoria?: number
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      documentos: {
        Row: {
          aplicacion: string | null
          aplicacion_arr: string[]
          archivo_url: string | null
          area_id: string | null
          codigo: string
          comentarios: string | null
          created_at: string
          created_by: string | null
          drive_url: string | null
          empresa_id: string | null
          estatus: string
          fecha_ultima_edicion: string | null
          id: string
          nivel: number | null
          nombre: string
          origen: string | null
          tipo: string
          updated_at: string
          version: string | null
        }
        Insert: {
          aplicacion?: string | null
          aplicacion_arr?: string[]
          archivo_url?: string | null
          area_id?: string | null
          codigo: string
          comentarios?: string | null
          created_at?: string
          created_by?: string | null
          drive_url?: string | null
          empresa_id?: string | null
          estatus?: string
          fecha_ultima_edicion?: string | null
          id?: string
          nivel?: number | null
          nombre: string
          origen?: string | null
          tipo: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          aplicacion?: string | null
          aplicacion_arr?: string[]
          archivo_url?: string | null
          area_id?: string | null
          codigo?: string
          comentarios?: string | null
          created_at?: string
          created_by?: string | null
          drive_url?: string | null
          empresa_id?: string | null
          estatus?: string
          fecha_ultima_edicion?: string | null
          id?: string
          nivel?: number | null
          nombre?: string
          origen?: string | null
          tipo?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_cargos: {
        Row: {
          cargo_id: string
          documento_id: string
          id: string
        }
        Insert: {
          cargo_id: string
          documento_id: string
          id?: string
        }
        Update: {
          cargo_id?: string
          documento_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_cargos_cargo_id_fkey"
            columns: ["cargo_id"]
            isOneToOne: false
            referencedRelation: "cargos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_cargos_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_relaciones: {
        Row: {
          created_at: string
          documento_destino_id: string
          documento_origen_id: string
          id: string
          tipo_relacion: string
        }
        Insert: {
          created_at?: string
          documento_destino_id: string
          documento_origen_id: string
          id?: string
          tipo_relacion: string
        }
        Update: {
          created_at?: string
          documento_destino_id?: string
          documento_origen_id?: string
          id?: string
          tipo_relacion?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_relaciones_documento_destino_id_fkey"
            columns: ["documento_destino_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_relaciones_documento_origen_id_fkey"
            columns: ["documento_origen_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_versiones: {
        Row: {
          archivo_url: string | null
          creado_por: string | null
          created_at: string
          documento_id: string
          fecha: string | null
          id: string
          notas_cambio: string | null
          version_numero: string
        }
        Insert: {
          archivo_url?: string | null
          creado_por?: string | null
          created_at?: string
          documento_id: string
          fecha?: string | null
          id?: string
          notas_cambio?: string | null
          version_numero: string
        }
        Update: {
          archivo_url?: string | null
          creado_por?: string | null
          created_at?: string
          documento_id?: string
          fecha?: string | null
          id?: string
          notas_cambio?: string | null
          version_numero?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_versiones_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_versiones_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          activo: boolean
          clave: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          clave: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          clave?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      eventos_calendario: {
        Row: {
          all_day: boolean | null
          area_id: string | null
          color: string | null
          creado_por: string | null
          created_at: string
          descripcion: string | null
          empresa_id: string | null
          fecha_fin: string | null
          fecha_inicio: string
          google_calendar_event_id: string | null
          id: string
          invitados_email: string[]
          referencia_id: string | null
          referencia_tabla: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          all_day?: boolean | null
          area_id?: string | null
          color?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          google_calendar_event_id?: string | null
          id?: string
          invitados_email?: string[]
          referencia_id?: string | null
          referencia_tabla?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          all_day?: boolean | null
          area_id?: string | null
          color?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion?: string | null
          empresa_id?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          google_calendar_event_id?: string | null
          id?: string
          invitados_email?: string[]
          referencia_id?: string | null
          referencia_tabla?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_calendario_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_calendario_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_calendario_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      org_config: {
        Row: {
          id: string
          logo_url: string | null
          nombre_completo: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          logo_url?: string | null
          nombre_completo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          logo_url?: string | null
          nombre_completo?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_config_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pnc: {
        Row: {
          area_id: string | null
          area_ids: string[]
          auditoria_id: string | null
          creado_por: string | null
          created_at: string
          descripcion: string
          empresa_id: string | null
          estatus: string
          fecha_cierre: string | null
          fecha_compromiso: string | null
          fecha_origen: string
          id: string
          metodologia: string | null
          numero_anio: string
          observaciones: string | null
          origen: string
          proceso_documento_id: string | null
          proceso_texto: string | null
          razon: string | null
          responsables: string[]
          solucion: string | null
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          area_ids?: string[]
          auditoria_id?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion: string
          empresa_id?: string | null
          estatus?: string
          fecha_cierre?: string | null
          fecha_compromiso?: string | null
          fecha_origen?: string
          id?: string
          metodologia?: string | null
          numero_anio: string
          observaciones?: string | null
          origen: string
          proceso_documento_id?: string | null
          proceso_texto?: string | null
          razon?: string | null
          responsables?: string[]
          solucion?: string | null
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          area_ids?: string[]
          auditoria_id?: string | null
          creado_por?: string | null
          created_at?: string
          descripcion?: string
          empresa_id?: string | null
          estatus?: string
          fecha_cierre?: string | null
          fecha_compromiso?: string | null
          fecha_origen?: string
          id?: string
          metodologia?: string | null
          numero_anio?: string
          observaciones?: string | null
          origen?: string
          proceso_documento_id?: string | null
          proceso_texto?: string | null
          razon?: string | null
          responsables?: string[]
          solucion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnc_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnc_auditoria_fk"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "auditorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnc_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnc_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnc_proceso_documento_id_fkey"
            columns: ["proceso_documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      pnc_acciones: {
        Row: {
          created_at: string
          descripcion: string
          estatus: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          pnc_id: string
          responsable_nombre: string | null
          responsable_usuario_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          estatus?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          pnc_id: string
          responsable_nombre?: string | null
          responsable_usuario_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          estatus?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          pnc_id?: string
          responsable_nombre?: string | null
          responsable_usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pnc_acciones_pnc_id_fkey"
            columns: ["pnc_id"]
            isOneToOne: false
            referencedRelation: "pnc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnc_acciones_responsable_usuario_id_fkey"
            columns: ["responsable_usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pnc_evidencias: {
        Row: {
          archivo_url: string
          created_at: string
          id: string
          nombre_archivo: string
          pnc_id: string
          subido_por: string | null
          tipo: string
        }
        Insert: {
          archivo_url: string
          created_at?: string
          id?: string
          nombre_archivo: string
          pnc_id: string
          subido_por?: string | null
          tipo: string
        }
        Update: {
          archivo_url?: string
          created_at?: string
          id?: string
          nombre_archivo?: string
          pnc_id?: string
          subido_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnc_evidencias_pnc_id_fkey"
            columns: ["pnc_id"]
            isOneToOne: false
            referencedRelation: "pnc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnc_evidencias_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pnc_historial_estatus: {
        Row: {
          cambiado_por: string | null
          comentario: string | null
          created_at: string
          estatus_anterior: string | null
          estatus_nuevo: string
          id: string
          pnc_id: string
        }
        Insert: {
          cambiado_por?: string | null
          comentario?: string | null
          created_at?: string
          estatus_anterior?: string | null
          estatus_nuevo: string
          id?: string
          pnc_id: string
        }
        Update: {
          cambiado_por?: string | null
          comentario?: string | null
          created_at?: string
          estatus_anterior?: string | null
          estatus_nuevo?: string
          id?: string
          pnc_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnc_historial_estatus_cambiado_por_fkey"
            columns: ["cambiado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pnc_historial_estatus_pnc_id_fkey"
            columns: ["pnc_id"]
            isOneToOne: false
            referencedRelation: "pnc"
            referencedColumns: ["id"]
          },
        ]
      }
      pnc_plan_mejora: {
        Row: {
          analisis_causa_raiz: string | null
          created_at: string
          fecha_implementacion: string | null
          fecha_inicio_plan: string | null
          id: string
          kpi_dias: number | null
          pnc_id: string
          updated_at: string
        }
        Insert: {
          analisis_causa_raiz?: string | null
          created_at?: string
          fecha_implementacion?: string | null
          fecha_inicio_plan?: string | null
          id?: string
          kpi_dias?: number | null
          pnc_id: string
          updated_at?: string
        }
        Update: {
          analisis_causa_raiz?: string | null
          created_at?: string
          fecha_implementacion?: string | null
          fecha_inicio_plan?: string | null
          id?: string
          kpi_dias?: number | null
          pnc_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pnc_plan_mejora_pnc_id_fkey"
            columns: ["pnc_id"]
            isOneToOne: false
            referencedRelation: "pnc"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos: {
        Row: {
          alta_prioridad: boolean | null
          area_id: string | null
          area_ids: string[]
          avance_calculado: number | null
          creado_por: string | null
          created_at: string
          empresa_id: string | null
          estatus: string
          fecha_fin_plan: string | null
          fecha_fin_real: string | null
          fecha_inicio_plan: string | null
          fecha_inicio_real: string | null
          id: string
          nombre: string
          nota_observacion: string | null
          objetivo: string | null
          proceso_perteneciente: string | null
          responsable_nombre: string | null
          responsable_usuario_id: string | null
          revisado_at: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          alta_prioridad?: boolean | null
          area_id?: string | null
          area_ids?: string[]
          avance_calculado?: number | null
          creado_por?: string | null
          created_at?: string
          empresa_id?: string | null
          estatus?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          id?: string
          nombre: string
          nota_observacion?: string | null
          objetivo?: string | null
          proceso_perteneciente?: string | null
          responsable_nombre?: string | null
          responsable_usuario_id?: string | null
          revisado_at?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          alta_prioridad?: boolean | null
          area_id?: string | null
          area_ids?: string[]
          avance_calculado?: number | null
          creado_por?: string | null
          created_at?: string
          empresa_id?: string | null
          estatus?: string
          fecha_fin_plan?: string | null
          fecha_fin_real?: string | null
          fecha_inicio_plan?: string | null
          fecha_inicio_real?: string | null
          id?: string
          nombre?: string
          nota_observacion?: string | null
          objetivo?: string | null
          proceso_perteneciente?: string | null
          responsable_nombre?: string | null
          responsable_usuario_id?: string | null
          revisado_at?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_creado_por_fkey"
            columns: ["creado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyectos_responsable_usuario_id_fkey"
            columns: ["responsable_usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      subtareas: {
        Row: {
          actividad_id: string
          completada: boolean | null
          created_at: string
          descripcion: string
          fecha_limite: string | null
          id: string
          orden: number | null
        }
        Insert: {
          actividad_id: string
          completada?: boolean | null
          created_at?: string
          descripcion: string
          fecha_limite?: string | null
          id?: string
          orden?: number | null
        }
        Update: {
          actividad_id?: string
          completada?: boolean | null
          created_at?: string
          descripcion?: string
          fecha_limite?: string | null
          id?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subtareas_actividad_id_fkey"
            columns: ["actividad_id"]
            isOneToOne: false
            referencedRelation: "actividades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          activo: boolean
          created_at: string
          email: string
          empresa_id: string | null
          id: string
          nombre_completo: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          email: string
          empresa_id?: string | null
          id: string
          nombre_completo: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          email?: string
          empresa_id?: string | null
          id?: string
          nombre_completo?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_quality_manager: { Args: { _uid: string }; Returns: boolean }
      is_quality_or_auditor: { Args: { _uid: string }; Returns: boolean }
      is_quality_staff: { Args: { _uid: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "gerente_calidad"
        | "jefe_calidad"
        | "analista"
        | "auditor_interno"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "gerente_calidad",
        "jefe_calidad",
        "analista",
        "auditor_interno",
      ],
    },
  },
} as const
