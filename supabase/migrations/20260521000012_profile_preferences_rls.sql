-- RLS for preferences and change requests.

alter table profile_preferences enable row level security;
alter table profile_change_requests enable row level security;

create policy "Users can view own preferences"
  on profile_preferences for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can upsert own preferences"
  on profile_preferences for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own preferences"
  on profile_preferences for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view own change requests"
  on profile_change_requests for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create own change requests"
  on profile_change_requests for insert
  to authenticated
  with check (auth.uid() = user_id);

-- No client updates for change requests; admin service role handles review.