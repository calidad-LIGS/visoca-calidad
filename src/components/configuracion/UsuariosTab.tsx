import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { createUsuario, updateUsuarioRol } from "@/lib/usuarios.functions";
import { ROLE_LABELS, ROLE_OPTIONS, type AppRole } from "@/lib/roles";
import { DataTable, Td } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Usuario {
  id: string;
  nombre_completo: string;
  email: string;
  activo: boolean;
  empresa_id: string | null;
}

export function UsuariosTab() {
  const qc = useQueryClient();
  const create = useServerFn(createUsuario);
  const updateRol = useServerFn(updateUsuarioRol);

  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<AppRole>("analista");
  const [empresaId, setEmpresaId] = useState<string>("none");

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nombre_completo, email, activo, empresa_id")
        .order("nombre_completo");
      if (error) throw error;
      return data as Usuario[];
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data as { user_id: string; role: AppRole }[];
    },
  });

  const { data: empresas = [] } = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre");
      if (error) throw error;
      return data as { id: string; nombre: string }[];
    },
  });

  const rolDe = (uid: string) => roles.find((r) => r.user_id === uid)?.role;

  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          nombre_completo: nombre,
          email,
          password,
          rol,
          empresa_id: empresaId === "none" ? null : empresaId,
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      qc.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Usuario creado");
      setOpen(false);
      setNombre("");
      setEmail("");
      setPassword("");
      setRol("analista");
      setEmpresaId("none");
    },
    onError: (e: Error) => toast.error(e.message || "No se pudo crear el usuario"),
  });

  const toggle = useMutation({
    mutationFn: async (u: Usuario) => {
      const { error } = await supabase
        .from("usuarios")
        .update({ activo: !u.activo })
        .eq("id", u.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["usuarios"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const changeRol = useMutation({
    mutationFn: (v: { user_id: string; rol: AppRole }) => updateRol({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Rol actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Nuevo usuario
        </Button>
      </div>

      <DataTable
        headers={["Nombre", "Email", "Rol", "Activo"]}
        isEmpty={!isLoading && usuarios.length === 0}
        empty="No hay usuarios registrados."
      >
        {usuarios.map((u) => (
          <tr key={u.id}>
            <Td className="font-medium text-foreground">{u.nombre_completo}</Td>
            <Td className="text-muted-foreground">{u.email}</Td>
            <Td>
              <Select
                value={rolDe(u.id) ?? undefined}
                onValueChange={(v) =>
                  changeRol.mutate({ user_id: u.id, rol: v as AppRole })
                }
              >
                <SelectTrigger className="h-8 w-[180px]">
                  <SelectValue placeholder="Sin rol" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Td>
            <Td>
              <Switch checked={u.activo} onCheckedChange={() => toggle.mutate(u)} />
            </Td>
          </tr>
        ))}
      </DataTable>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre completo</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contraseña temporal</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Rol</Label>
                <Select value={rol} onValueChange={(v) => setRol(v as AppRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Empresa</Label>
                <Select value={empresaId} onValueChange={setEmpresaId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {empresas.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMut.mutate()}
              disabled={
                createMut.isPending ||
                !nombre.trim() ||
                !email.trim() ||
                password.length < 6
              }
            >
              Crear usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
