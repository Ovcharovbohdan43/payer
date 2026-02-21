-- Fix RLS policies for logos bucket (resolve "new row violates row-level security policy")
-- Use path prefix check instead of foldername; add SELECT for upsert flow

drop policy if exists "logos_upload_own" on storage.objects;
drop policy if exists "logos_update_own" on storage.objects;
drop policy if exists "logos_delete_own" on storage.objects;

-- INSERT: path must start with {auth.uid()}/
create policy "logos_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'logos'
    and name like (auth.uid()::text || '/%')
  );

-- UPDATE: same path check for existing row
create policy "logos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'logos'
    and name like (auth.uid()::text || '/%')
  );

-- DELETE: same path check (required for upsert: true)
create policy "logos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'logos'
    and name like (auth.uid()::text || '/%')
  );

-- SELECT: allow authenticated to read own files (needed for upsert flow)
create policy "logos_select_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'logos'
    and name like (auth.uid()::text || '/%')
  );
