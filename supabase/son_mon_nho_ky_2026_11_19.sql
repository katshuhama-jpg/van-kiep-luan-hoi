-- 19/11 (Tyler: "Mời đạo hữu ký" cũng phải mời được trong game). Bảng, hàm MỚI; không sửa hàm cũ.
-- Người trong môn chưa đủ chữ ký tìm đạo hữu (có chân thân, chơi trong 7 ngày, chưa ký đủ 2 môn Kỷ này) rồi bấm Nhờ ký.
-- Người được nhờ thấy ở tab Sơn Môn và trong Thư, bấm Ký là gọi đúng vkl_sm_cosign cũ (giữ nguyên mọi luật ký).
-- Mỗi người gửi tối đa 10 lời nhờ mỗi ngày; lời nhờ hết hạn khi môn đủ ký, giải tán, hoặc quá hạn ký của môn.

create table if not exists public.vkl_sm_nho_ky (
  id bigint generated always as identity primary key,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  tu uuid not null references public.vkl_players (id) on delete cascade,
  toi uuid not null references public.vkl_players (id) on delete cascade,
  luc timestamptz not null default now(),
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'ky', 'tu_choi', 'huy')),
  xong_luc timestamptz
);
create unique index if not exists vkl_sm_nho_ky_cho on public.vkl_sm_nho_ky (mon_id, toi) where trang_thai = 'cho';
create index if not exists vkl_sm_nho_ky_toi on public.vkl_sm_nho_ky (toi, trang_thai);
create index if not exists vkl_sm_nho_ky_tu_luc on public.vkl_sm_nho_ky (tu, luc);
alter table public.vkl_sm_nho_ky enable row level security;

-- môn của người gọi còn đang chờ ký không (trả id môn hoặc lỗi)
create or replace function vkl_priv.sm_mon_cho_ky(p_me uuid)
returns public.vkl_sm_mon language plpgsql stable security definer set search_path = '' as $$
declare m public.vkl_sm_member; v public.vkl_sm_mon;
begin
  select * into m from public.vkl_sm_member where player_id = p_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select * into v from public.vkl_sm_mon where id = m.mon_id;
  if v.du_ky then raise exception 'SM_DA_DU_KY'; end if;
  if v.giai_tan_luc is not null or v.het_han_ky <= now() then raise exception 'SM_KHONG_CO_MON'; end if;
  return v;
end;
$$;

create or replace function public.vkl_sm_ky_tim(p_token uuid, p_q text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v public.vkl_sm_mon := vkl_priv.sm_mon_cho_ky(v_me); v_q text := left(lower(trim(coalesce(p_q, ''))), 30);
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object('ten', u.username, 'phap_danh', u.pd, 'kiep', u.kiep, 'choi_luc', u.choi_luc, 'da_nho', u.da_nho) order by u.choi_luc desc)
    from (
      select p.username, p.meta -> 'chanThan' ->> 'name' pd,
             case when jsonb_typeof(p.meta -> 'lives') = 'number' then (p.meta ->> 'lives')::numeric::int else 0 end kiep,
             g.choi_luc,
             exists (select 1 from public.vkl_sm_nho_ky x where x.mon_id = v.id and x.toi = p.id and x.trang_thai = 'cho') da_nho
        from (select l.player_id, max(l.created_at) choi_luc from public.vkl_lives l
               where l.created_at > now() - interval '7 days' and l.player_id is not null group by l.player_id) g
        join public.vkl_players p on p.id = g.player_id
       where p.id <> v_me and p.id <> v.mon_chu
         and jsonb_typeof(p.meta -> 'chanThan') = 'object'
         and not exists (select 1 from public.vkl_sm_mon_ky k where k.mon_id = v.id and k.player_id = p.id)
         and (select count(*) from public.vkl_sm_mon_ky k join public.vkl_sm_mon mm on mm.id = k.mon_id where k.player_id = p.id and mm.ky_lap = v.ky_lap) < 2
         and (v_q = '' or position(v_q in lower(p.username)) > 0 or position(v_q in lower(coalesce(p.meta -> 'chanThan' ->> 'name', ''))) > 0)
       order by g.choi_luc desc
       limit 30) u), '[]'::jsonb);
end;
$$;

create or replace function public.vkl_sm_ky_nho(p_token uuid, p_ten text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v public.vkl_sm_mon := vkl_priv.sm_mon_cho_ky(v_me); v_ho uuid; v_ten text; v_tu text;
begin
  select id, username into v_ho, v_ten from public.vkl_players where username = lower(trim(coalesce(p_ten, ''))) and jsonb_typeof(meta -> 'chanThan') = 'object';
  if v_ho is null or v_ho = v_me or v_ho = v.mon_chu then raise exception 'SM_MOI_KHONG_NGUOI'; end if;
  if exists (select 1 from public.vkl_sm_mon_ky where mon_id = v.id and player_id = v_ho) then raise exception 'SM_DA_KY_NGUOI'; end if;
  perform pg_advisory_xact_lock(hashtext('vkl_sm_moi'), hashtext(v_me::text));
  if (select count(*) from public.vkl_sm_nho_ky where tu = v_me and luc > now() - interval '1 day') >= 10 then raise exception 'SM_MOI_NHIEU'; end if;
  insert into public.vkl_sm_nho_ky (mon_id, tu, toi) values (v.id, v_me, v_ho) on conflict do nothing;
  if not found then raise exception 'SM_DA_MOI'; end if;
  select coalesce(meta -> 'chanThan' ->> 'name', username) into v_tu from public.vkl_players where id = v_me;
  insert into public.vkl_mail (to_player, from_player, kind, body)
  values (v_ten, (select username from public.vkl_players where id = v_me), 'son_mon',
          v_tu || ' nhờ bạn ký cùng lập môn ' || v.ten || '. Vào tab Sơn Môn để Ký, chỉ một nút bấm, không phải vào môn.');
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.vkl_sm_ky_ds(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'mon', mo.id, 'ten_mon', mo.ten, 'huy_hieu', mo.huy_hieu,
            'so_ky', (select count(*) from public.vkl_sm_mon_ky k where k.mon_id = mo.id), 'het_han', mo.het_han_ky,
            'nguoi', p.username, 'phap_danh', p.meta -> 'chanThan' ->> 'name', 'luc', x.luc) order by x.luc desc)
     from public.vkl_sm_nho_ky x join public.vkl_sm_mon mo on mo.id = x.mon_id join public.vkl_players p on p.id = x.tu
    where x.toi = v_me and x.trang_thai = 'cho' and not mo.du_ky and mo.giai_tan_luc is null and mo.het_han_ky > now()), '[]'::jsonb);
end;
$$;

-- Ký hoặc từ chối. Ký: gọi vkl_sm_cosign cũ (giữ đủ luật ký), rồi ghi lời nhờ là đã ký.
create or replace function public.vkl_sm_ky_tra(p_token uuid, p_id bigint, p_ky boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); x public.vkl_sm_nho_ky; r jsonb; v_ten text; v_mon text;
begin
  select * into x from public.vkl_sm_nho_ky where id = p_id and toi = v_me for update;
  if x.id is null or x.trang_thai <> 'cho' then raise exception 'SM_MOI_HET'; end if;
  if not p_ky then
    update public.vkl_sm_nho_ky set trang_thai = 'tu_choi', xong_luc = now() where id = x.id;
    return jsonb_build_object('ok', true);
  end if;
  r := public.vkl_sm_cosign(p_token, x.mon_id);
  update public.vkl_sm_nho_ky set trang_thai = 'ky', xong_luc = now() where id = x.id;
  select coalesce(meta -> 'chanThan' ->> 'name', username) into v_ten from public.vkl_players where id = v_me;
  select ten into v_mon from public.vkl_sm_mon where id = x.mon_id;
  insert into public.vkl_mail (to_player, from_player, kind, body)
  select p.username, (select username from public.vkl_players where id = v_me), 'son_mon',
         v_ten || ' đã ký cùng lập ' || v_mon || case when (r ->> 'du_ky')::boolean then '. Môn đã đủ chữ ký.' else '.' end
    from public.vkl_players p where p.id = x.tu;
  return r || jsonb_build_object('ok', true);
end;
$$;

revoke all on function vkl_priv.sm_mon_cho_ky(uuid) from public;
revoke all on function public.vkl_sm_ky_tim(uuid, text) from public;
revoke all on function public.vkl_sm_ky_nho(uuid, text) from public;
revoke all on function public.vkl_sm_ky_ds(uuid) from public;
revoke all on function public.vkl_sm_ky_tra(uuid, bigint, boolean) from public;
grant execute on function public.vkl_sm_ky_tim(uuid, text) to anon, authenticated;
grant execute on function public.vkl_sm_ky_nho(uuid, text) to anon, authenticated;
grant execute on function public.vkl_sm_ky_ds(uuid) to anon, authenticated;
grant execute on function public.vkl_sm_ky_tra(uuid, bigint, boolean) to anon, authenticated;
