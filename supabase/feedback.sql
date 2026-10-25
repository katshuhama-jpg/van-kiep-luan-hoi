-- ---------- Góp ý tính năng ----------
create table if not exists public.vkl_feedback (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  kind text not null default 'tinh_nang' check (kind in ('tinh_nang', 'loi', 'can_bang', 'khac')),
  content text not null check (char_length(content) between 5 and 500),
  status text not null default 'moi' check (status in ('moi', 'dang_lam', 'da_xong', 'tu_choi')),
  votes int not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.vkl_feedback_votes (
  feedback_id bigint not null references public.vkl_feedback (id) on delete cascade,
  player_id uuid not null references public.vkl_players (id) on delete cascade,
  primary key (feedback_id, player_id)
);
alter table public.vkl_feedback enable row level security;
alter table public.vkl_feedback_votes enable row level security;

create or replace function public.vkl_feedback_add(p_token uuid, p_kind text, p_content text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pid uuid := public.vkl_player(p_token);
  v_id bigint;
begin
  if v_pid is null then raise exception 'NOT_LOGGED_IN'; end if;
  if exists (select 1 from public.vkl_feedback where player_id = v_pid and created_at > now() - interval '30 seconds') then
    raise exception 'TOO_FAST';
  end if;
  if (select count(*) from public.vkl_feedback where player_id = v_pid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'TOO_MANY';
  end if;
  insert into public.vkl_feedback (player_id, kind, content)
  values (v_pid, coalesce(nullif(p_kind, ''), 'tinh_nang'), btrim(p_content))
  returning id into v_id;
  insert into public.vkl_feedback_votes (feedback_id, player_id) values (v_id, v_pid);
  update public.vkl_feedback set votes = 1 where id = v_id;
  return v_id;
end;
$$;

create or replace function public.vkl_feedback_list(p_token uuid default null)
returns table (id bigint, username text, kind text, content text, status text, votes int, created_at timestamptz, voted boolean, mine boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select f.id, p.username, f.kind, f.content, f.status, f.votes, f.created_at,
    exists (select 1 from public.vkl_feedback_votes v where v.feedback_id = f.id and v.player_id = public.vkl_player(p_token)),
    f.player_id = public.vkl_player(p_token)
  from public.vkl_feedback f
  join public.vkl_players p on p.id = f.player_id
  order by f.votes desc, f.created_at desc
  limit 200;
$$;

create or replace function public.vkl_feedback_vote(p_token uuid, p_id bigint)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pid uuid := public.vkl_player(p_token);
  v_n int;
begin
  if v_pid is null then raise exception 'NOT_LOGGED_IN'; end if;
  -- mỗi người đồng ý một lần, không rút lại
  if exists (select 1 from public.vkl_feedback_votes where feedback_id = p_id and player_id = v_pid) then
    select votes into v_n from public.vkl_feedback where id = p_id;
  else
    insert into public.vkl_feedback_votes (feedback_id, player_id) values (p_id, v_pid);
    update public.vkl_feedback set votes = votes + 1 where id = p_id returning votes into v_n;
  end if;
  return v_n;
end;
$$;

grant execute on function public.vkl_feedback_add(uuid, text, text) to anon, authenticated;
grant execute on function public.vkl_feedback_list(uuid) to anon, authenticated;
grant execute on function public.vkl_feedback_vote(uuid, bigint) to anon, authenticated;
