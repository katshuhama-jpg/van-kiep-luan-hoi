-- 19/11 (Tyler: "Mời người chưa có môn" phải mời trong game như mời Sư Đồ). Bảng, hàm MỚI; không sửa hàm cũ.
-- Ai trong môn cũng mời được người CHƯA có môn (có chân thân, chơi trong 7 ngày). Người được mời thấy lời mời ở
-- tab Sơn Môn và trong Thư, bấm Nhận là vào môn ngay (lời mời thay cho duyệt đơn), vẫn phải đủ điều kiện kiếp/ngày của môn.
-- Mỗi người gửi tối đa 10 lời mời mỗi ngày; lời mời quá 3 ngày tự hết hạn.

create table if not exists public.vkl_sm_moi (
  id bigint generated always as identity primary key,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  tu uuid not null references public.vkl_players (id) on delete cascade,
  toi uuid not null references public.vkl_players (id) on delete cascade,
  luc timestamptz not null default now(),
  trang_thai text not null default 'cho' check (trang_thai in ('cho', 'nhan', 'tu_choi', 'huy')),
  xong_luc timestamptz
);
create unique index if not exists vkl_sm_moi_cho on public.vkl_sm_moi (mon_id, toi) where trang_thai = 'cho';
create index if not exists vkl_sm_moi_toi on public.vkl_sm_moi (toi, trang_thai);
create index if not exists vkl_sm_moi_tu_luc on public.vkl_sm_moi (tu, luc);
alter table public.vkl_sm_moi enable row level security;

-- Người trong môn tìm người chưa có môn để mời (rỗng: người vừa chơi gần đây). Tối đa 30.
create or replace function public.vkl_sm_moi_tim(p_token uuid, p_q text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_q text := lower(trim(coalesce(p_q, '')));
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  v_q := left(v_q, 30);
  return jsonb_build_object('day', vkl_priv.sm_mon_n(m.mon_id) >= vkl_priv.sm_cfg('mon', 'toi_da'), 'ds', coalesce((
    select jsonb_agg(jsonb_build_object('ten', u.username, 'phap_danh', u.pd, 'kiep', u.kiep, 'lc', u.lc, 'choi_luc', u.choi_luc,
             'da_moi', u.da_moi, 'du_dk', vkl_priv.sm_du_dk(u.id, m.mon_id)) order by u.choi_luc desc)
    from (
      select p.id, p.username, p.meta -> 'chanThan' ->> 'name' pd,
             case when jsonb_typeof(p.meta -> 'lives') = 'number' then (p.meta ->> 'lives')::numeric::int else 0 end kiep,
             round(coalesce((select l.lc from public.vkl_sm_luc_chien l where l.player_id = p.id), 0))::int lc,
             g.choi_luc,
             exists (select 1 from public.vkl_sm_moi x where x.mon_id = m.mon_id and x.toi = p.id and x.trang_thai = 'cho' and x.luc > now() - interval '3 days') da_moi
        from (select l.player_id, max(l.created_at) choi_luc from public.vkl_lives l
               where l.created_at > now() - interval '7 days' and l.player_id is not null group by l.player_id) g
        join public.vkl_players p on p.id = g.player_id
       where p.id <> v_me
         and jsonb_typeof(p.meta -> 'chanThan') = 'object'
         and vkl_priv.sm_ranh(p.id) is null
         and (v_q = '' or position(v_q in lower(p.username)) > 0 or position(v_q in lower(coalesce(p.meta -> 'chanThan' ->> 'name', ''))) > 0)
       order by g.choi_luc desc
       limit 30) u), '[]'::jsonb));
end;
$$;

-- Gửi lời mời vào môn mình. Người kia đã nộp đơn xin vào môn mình thì vào luôn.
create or replace function public.vkl_sm_moi_gui(p_token uuid, p_ten text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); m public.vkl_sm_member; v_ho uuid; v_mon public.vkl_sm_mon; v_tu text; v_ten text; v_don bigint;
begin
  select * into m from public.vkl_sm_member where player_id = v_me;
  if m.mon_id is null then raise exception 'SM_CHUA_CO_MON'; end if;
  select id, username into v_ho, v_ten from public.vkl_players where username = lower(trim(coalesce(p_ten, ''))) and jsonb_typeof(meta -> 'chanThan') = 'object';
  if v_ho is null then raise exception 'SM_MOI_KHONG_NGUOI'; end if;
  if v_ho = v_me then raise exception 'SM_MOI_KHONG_NGUOI'; end if;
  if vkl_priv.sm_ranh(v_ho) is not null then raise exception 'SM_MOI_CO_MON'; end if;
  select * into v_mon from public.vkl_sm_mon where id = m.mon_id;
  if vkl_priv.sm_mon_n(m.mon_id) >= vkl_priv.sm_cfg('mon', 'toi_da') then raise exception 'SM_DAY'; end if;
  perform pg_advisory_xact_lock(hashtext('vkl_sm_moi'), hashtext(v_me::text));
  if (select count(*) from public.vkl_sm_moi where tu = v_me and luc > now() - interval '1 day') >= 10 then raise exception 'SM_MOI_NHIEU'; end if;
  update public.vkl_sm_moi set trang_thai = 'huy', xong_luc = now() where mon_id = m.mon_id and toi = v_ho and trang_thai = 'cho' and luc <= now() - interval '3 days';
  -- người kia đã nộp đơn vào môn ta: nhận luôn
  select id into v_don from public.vkl_sm_don where player_id = v_ho and mon_id = m.mon_id and trang_thai = 'cho' limit 1;
  if v_don is not null then
    perform pg_advisory_xact_lock(hashtext('vkl_sm_player'), hashtext(v_ho::text));
    update public.vkl_sm_don set trang_thai = 'nhan' where id = v_don;
    perform vkl_priv.sm_vao(v_ho, m.mon_id, 'moi');
    return jsonb_build_object('ok', true, 'vao', true);
  end if;
  insert into public.vkl_sm_moi (mon_id, tu, toi) values (m.mon_id, v_me, v_ho) on conflict do nothing;
  if not found then raise exception 'SM_DA_MOI'; end if;
  select coalesce(meta -> 'chanThan' ->> 'name', username) into v_tu from public.vkl_players where id = v_me;
  insert into public.vkl_mail (to_player, from_player, kind, body)
  values (v_ten, (select username from public.vkl_players where id = v_me), 'son_mon',
          v_tu || ' mời bạn vào môn ' || v_mon.ten || '. Vào tab Sơn Môn để Nhận hoặc Từ chối. Lời mời giữ 3 ngày.');
  return jsonb_build_object('ok', true, 'vao', false);
end;
$$;

-- Lời mời vào môn đang chờ gửi tới ta (người chưa có môn)
create or replace function public.vkl_sm_moi_ds(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := public.vkl_player(p_token);
begin
  if v_me is null then return '[]'::jsonb; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', x.id, 'mon', mo.id, 'ten_mon', mo.ten, 'huy_hieu', mo.huy_hieu,
            'n', vkl_priv.sm_mon_n(mo.id), 'nguoi', p.username, 'phap_danh', p.meta -> 'chanThan' ->> 'name', 'luc', x.luc,
            'du_dk', vkl_priv.sm_du_dk(v_me, mo.id), 'dk_kiep', mo.dk_kiep, 'dk_ngay', mo.dk_tuoi_dao) order by x.luc desc)
     from public.vkl_sm_moi x join public.vkl_sm_mon mo on mo.id = x.mon_id join public.vkl_players p on p.id = x.tu
    where x.toi = v_me and x.trang_thai = 'cho' and x.luc > now() - interval '3 days'
      and mo.giai_tan_luc is null and mo.ky_lap is not distinct from vkl_priv.sm_ky_now()), '[]'::jsonb);
end;
$$;

-- Nhận hoặc từ chối một lời mời. Nhận: vào môn ngay (không cần duyệt đơn), vẫn theo điều kiện kiếp/ngày của môn.
create or replace function public.vkl_sm_moi_tra(p_token uuid, p_id bigint, p_nhan boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); x public.vkl_sm_moi; v_mon public.vkl_sm_mon; v_err text; v_ten text;
begin
  select * into x from public.vkl_sm_moi where id = p_id and toi = v_me for update;
  if x.id is null or x.trang_thai <> 'cho' or x.luc <= now() - interval '3 days' then raise exception 'SM_MOI_HET'; end if;
  if not p_nhan then
    update public.vkl_sm_moi set trang_thai = 'tu_choi', xong_luc = now() where id = x.id;
    return jsonb_build_object('ok', true);
  end if;
  perform pg_advisory_xact_lock(hashtext('vkl_sm_player'), hashtext(v_me::text));
  select * into v_mon from public.vkl_sm_mon where id = x.mon_id for update;
  if v_mon.id is null or v_mon.giai_tan_luc is not null or v_mon.ky_lap is distinct from vkl_priv.sm_ky_now() then
    update public.vkl_sm_moi set trang_thai = 'huy', xong_luc = now() where id = x.id;
    raise exception 'SM_KHONG_CO_MON';
  end if;
  v_err := vkl_priv.sm_ranh(v_me);
  if v_err is not null then raise exception '%', v_err; end if;
  if not vkl_priv.sm_du_dk(v_me, x.mon_id) then raise exception 'SM_CHUA_DU_DK'; end if;
  if vkl_priv.sm_mon_n(x.mon_id) >= vkl_priv.sm_cfg('mon', 'toi_da') then raise exception 'SM_DAY'; end if;
  update public.vkl_sm_moi set trang_thai = 'nhan', xong_luc = now() where id = x.id;
  update public.vkl_sm_moi set trang_thai = 'huy', xong_luc = now() where toi = v_me and trang_thai = 'cho' and id <> x.id;
  perform vkl_priv.sm_vao(v_me, x.mon_id, 'moi');
  select coalesce(meta -> 'chanThan' ->> 'name', username) into v_ten from public.vkl_players where id = v_me;
  insert into public.vkl_mail (to_player, from_player, kind, body)
  select p.username, (select username from public.vkl_players where id = v_me), 'son_mon', v_ten || ' đã nhận lời vào môn ' || v_mon.ten || '.'
    from public.vkl_players p where p.id = x.tu;
  return jsonb_build_object('ok', true, 'mon', x.mon_id);
end;
$$;

revoke all on function public.vkl_sm_moi_tim(uuid, text) from public;
revoke all on function public.vkl_sm_moi_gui(uuid, text) from public;
revoke all on function public.vkl_sm_moi_ds(uuid) from public;
revoke all on function public.vkl_sm_moi_tra(uuid, bigint, boolean) from public;
grant execute on function public.vkl_sm_moi_tim(uuid, text) to anon, authenticated;
grant execute on function public.vkl_sm_moi_gui(uuid, text) to anon, authenticated;
grant execute on function public.vkl_sm_moi_ds(uuid) to anon, authenticated;
grant execute on function public.vkl_sm_moi_tra(uuid, bigint, boolean) to anon, authenticated;
