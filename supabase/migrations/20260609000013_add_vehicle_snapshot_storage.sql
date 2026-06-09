-- supabase/migrations/20260609000013_add_vehicle_snapshot_storage.sql
-- Adds an optional vehicle image URL to rescue requests and provisions
-- a public storage bucket for driver snapshot uploads.

alter table rescue_requests
  add column if not exists vehicle_image_url text;

comment on column rescue_requests.vehicle_image_url is
  'Optional public URL for driver-uploaded vehicle snapshot at request creation time';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vehicle-snapshots',
  'vehicle-snapshots',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']::text[]
)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'vehicle_snapshots_public_read'
  ) then
    create policy vehicle_snapshots_public_read
      on storage.objects
      for select
      to public
      using (bucket_id = 'vehicle-snapshots');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'vehicle_snapshots_authenticated_upload'
  ) then
    create policy vehicle_snapshots_authenticated_upload
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'vehicle-snapshots'
        and (storage.foldername(name))[1] = auth.uid()::text
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'vehicle_snapshots_owner_update'
  ) then
    create policy vehicle_snapshots_owner_update
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'vehicle-snapshots'
        and owner = auth.uid()
      )
      with check (
        bucket_id = 'vehicle-snapshots'
        and owner = auth.uid()
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'vehicle_snapshots_owner_delete'
  ) then
    create policy vehicle_snapshots_owner_delete
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'vehicle-snapshots'
        and owner = auth.uid()
      );
  end if;
end $$;