grant select, insert, update, delete on public.admin_roles to authenticated;
grant all privileges on public.admin_roles to service_role;

grant select on public.audit_events to authenticated;
grant all privileges on public.audit_events to service_role;

grant select, update on public.notifications to authenticated;
grant all privileges on public.notifications to service_role;

grant select, insert, update on public.post_appeals to authenticated;
grant all privileges on public.post_appeals to service_role;
