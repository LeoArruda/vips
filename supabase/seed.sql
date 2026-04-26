insert into public.workspaces (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Acme Corp')
on conflict do nothing;
