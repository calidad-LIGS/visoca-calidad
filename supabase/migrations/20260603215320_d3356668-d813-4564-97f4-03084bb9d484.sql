-- Confirmar el correo de la cuenta recién creada
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
where id = '0dd2d286-ef95-4602-b7f8-3d9e43ddf660';

-- Ficha de usuario en la app
insert into public.usuarios (id, nombre_completo, email, activo)
values ('0dd2d286-ef95-4602-b7f8-3d9e43ddf660', 'Administrador', 'cmatu@grupoaduanero.com.mx', true)
on conflict (id) do update
  set nombre_completo = excluded.nombre_completo,
      email = excluded.email,
      activo = true;

-- Rol de mayor nivel
insert into public.user_roles (user_id, role)
values ('0dd2d286-ef95-4602-b7f8-3d9e43ddf660', 'gerente_calidad')
on conflict (user_id, role) do nothing;