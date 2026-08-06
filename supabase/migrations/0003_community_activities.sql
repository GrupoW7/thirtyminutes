-- 30minutes — make community-created activities discoverable.
-- Powers the "Descobrir na comunidade" search on the activities screen.
-- Own rows stay fully managed by "users manage own activities" (policies are OR-ed);
-- this only additionally exposes *completed custom* activities for read.
create policy "community custom activities are discoverable"
  on public.user_activities for select to authenticated
  using (custom_title is not null and completed = true);
