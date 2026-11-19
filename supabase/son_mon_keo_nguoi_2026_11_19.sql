-- Ngày 7b (19/11): Sơn Môn kéo người mới. Bảng, hàm, cron MỚI; không sửa hàm cũ.
-- Link mời của thành viên: /choi?sm=<mã môn>&tu=<tên tài khoản>&mn=<tên môn>. Người mới vào qua link, chơi kiếp 1, tạo chân thân
-- và có tài khoản thì máy gọi vkl_sm_ref_nhan: ghi một dòng vkl_sm_ref và gửi lời mời vào môn (vkl_sm_moi, Nhận một chạm ở tab Sơn Môn).
-- Người mới quay lại ngày thứ 2 (theo ngày Sơn Môn, đổi lúc 5:00) VÀ đã vào môn đó: người mời +20 phúc duyên, môn +3 Khí vận hôm đó,
-- thư báo cho người mời, chiến báo "X kéo được Y nhập môn". Chống tự mời: cùng thiết bị (sid) với người mời không tính,
-- tài khoản người mới phải tạo trong 7 ngày, mỗi người chỉ được ghi một lần. Trần 5 người thưởng mỗi ngày mỗi người mời.

create table if not exists public.vkl_sm_ref (
  id bigint generated always as identity primary key,
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  tu uuid not null references public.vkl_players (id) on delete cascade,
  toi uuid not null unique references public.vkl_players (id) on delete cascade,
  sid text,
  luc timestamptz not null default now(),
  moi_id bigint,
  vao_luc timestamptz,
  d2_luc timestamptz,
  thuong_luc timestamptz,
  ly_do text
);
create index if not exists vkl_sm_ref_cho on public.vkl_sm_ref (luc) where thuong_luc is null and ly_do is null;
create index if not exists vkl_sm_ref_mon_thuong on public.vkl_sm_ref (mon_id, thuong_luc);
create index if not exists vkl_sm_ref_tu_thuong on public.vkl_sm_ref (tu, thuong_luc);
alter table public.vkl_sm_ref enable row level security;

-- Người mới (đã có chân thân, có tài khoản) báo máy chủ mình đến qua link mời của p_tu ở môn p_mon.
create or replace function public.vkl_sm_ref_nhan(p_token uuid, p_mon bigint, p_tu text, p_sid text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_tu uuid; v_ten text; v_mon public.vkl_sm_mon; v_moi bigint; v_tao timestamptz; v_tu_ten text;
begin
  if exists (select 1 from public.vkl_sm_ref where toi = v_me) then return jsonb_build_object('ok', false, 'ly_do', 'da_co'); end if;
  select created_at into v_tao from public.vkl_players where id = v_me;
  if v_tao < now() - interval '7 days' then return jsonb_build_object('ok', false, 'ly_do', 'cu'); end if;
  select id, username, coalesce(meta -> 'chanThan' ->> 'name', username) into v_tu, v_ten, v_tu_ten from public.vkl_players where username = lower(trim(coalesce(p_tu, '')));
  if v_tu is null or v_tu = v_me then return jsonb_build_object('ok', false, 'ly_do', 'khong_nguoi'); end if;
  if not exists (select 1 from public.vkl_sm_member where player_id = v_tu and mon_id = p_mon) then return jsonb_build_object('ok', false, 'ly_do', 'khong_mon'); end if;
  select * into v_mon from public.vkl_sm_mon where id = p_mon;
  if v_mon.id is null or v_mon.giai_tan_luc is not null or v_mon.ky_lap is distinct from vkl_priv.sm_ky_now() then return jsonb_build_object('ok', false, 'ly_do', 'khong_mon'); end if;
  -- cùng thiết bị với người mời: ghi lại để Tyler xem, không thưởng
  if p_sid is not null and exists (select 1 from public.vkl_events e where e.player_id = v_tu and e.sid = left(p_sid, 60) and e.created_at > now() - interval '7 days') then
    insert into public.vkl_sm_ref (mon_id, tu, toi, sid, ly_do) values (p_mon, v_tu, v_me, left(p_sid, 60), 'cung_may') on conflict (toi) do nothing;
    return jsonb_build_object('ok', false, 'ly_do', 'cung_may');
  end if;
  insert into public.vkl_sm_ref (mon_id, tu, toi, sid) values (p_mon, v_tu, v_me, left(p_sid, 60)) on conflict (toi) do nothing;
  if not found then return jsonb_build_object('ok', false, 'ly_do', 'da_co'); end if;
  -- đã có môn thì chỉ ghi, không mời
  if exists (select 1 from public.vkl_sm_member where player_id = v_me) then return jsonb_build_object('ok', true, 'moi', false); end if;
  insert into public.vkl_sm_moi (mon_id, tu, toi) values (p_mon, v_tu, v_me) on conflict do nothing returning id into v_moi;
  update public.vkl_sm_ref set moi_id = v_moi where toi = v_me;
  insert into public.vkl_mail (to_player, from_player, kind, body)
  select p.username, v_ten, 'son_mon', v_tu_ten || ' mời bạn vào môn ' || v_mon.ten || '. Vào tab Sơn Môn, bấm Nhận là vào môn. Lời mời giữ 3 ngày.'
    from public.vkl_players p where p.id = v_me;
  return jsonb_build_object('ok', true, 'moi', v_moi is not null, 'ten_mon', v_mon.ten);
end;
$$;

-- Cron mỗi giờ (phút 7): ghi người đã vào môn, đã quay lại ngày 2, rồi phát thưởng.
create or replace function vkl_priv.sm_ref_tick()
returns void language plpgsql security definer set search_path = '' as $$
declare r record; v_ky int := vkl_priv.sm_ky_now(); v_tu text; v_moi text; v_ten_tu text; v_ten_moi text;
begin
  update public.vkl_sm_ref f set vao_luc = now()
   where f.vao_luc is null and f.ly_do is null
     and exists (select 1 from public.vkl_sm_member m where m.player_id = f.toi and m.mon_id = f.mon_id);
  update public.vkl_sm_ref f set d2_luc = now()
   where f.d2_luc is null and f.ly_do is null and f.luc > now() - interval '8 days'
     and exists (select 1 from public.vkl_lives l where l.player_id = f.toi and l.created_at > f.luc
                  and vkl_priv.sm_day(l.created_at) > vkl_priv.sm_day(f.luc));
  for r in
    select f.* from public.vkl_sm_ref f
     where f.thuong_luc is null and f.ly_do is null and f.vao_luc is not null and f.d2_luc is not null
     order by f.d2_luc
  loop
    if (select count(*) from public.vkl_sm_ref x where x.tu = r.tu and x.thuong_luc > now() - interval '1 day') >= 5 then
      continue;
    end if;
    update public.vkl_sm_ref set thuong_luc = now() where id = r.id;
    select username, coalesce(meta -> 'chanThan' ->> 'name', username) into v_tu, v_ten_tu from public.vkl_players where id = r.tu;
    select username, coalesce(meta -> 'chanThan' ->> 'name', username) into v_moi, v_ten_moi from public.vkl_players where id = r.toi;
    insert into public.vkl_gift (to_player, from_player, kind, amount, note)
    values (v_tu, 'son_mon', 'phuc', 20, 'Ngươi kéo được ' || v_ten_moi || ' nhập môn và ở lại tới ngày thứ hai');
    perform vkl_priv.sm_add_kv(r.mon_id, 3);
    insert into public.vkl_mail (to_player, from_player, kind, body)
    values (v_tu, 'son_mon', 'son_mon', v_ten_moi || ' đã quay lại ngày thứ hai. Ngươi được 20 phúc duyên, môn được 3 Khí vận hôm nay.');
    if v_ky is not null then
      insert into public.vkl_sm_bao (ky_id, loai, mon_a, noi_dung)
      values (v_ky, 'keo_nguoi', r.mon_id, jsonb_build_object('nguoi', v_ten_tu, 'moi', v_ten_moi));
    end if;
  end loop;
end;
$$;

-- Bảng "Môn kéo người" tuần này (từ thứ Hai 5:00): số người đã thưởng mỗi môn, 10 môn đầu.
create or replace function public.vkl_sm_keo_bang()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('mon', x.mon_id, 'ten', mo.ten, 'huy_hieu', mo.huy_hieu, 'n', x.n) order by x.n desc, x.cuoi), '[]'::jsonb)
    from (select f.mon_id, count(*) n, max(f.thuong_luc) cuoi from public.vkl_sm_ref f
           where f.thuong_luc >= (date_trunc('week', (now() at time zone 'Asia/Ho_Chi_Minh') - interval '5 hour') + interval '5 hour') at time zone 'Asia/Ho_Chi_Minh'
           group by f.mon_id order by count(*) desc, max(f.thuong_luc) limit 10) x
    join public.vkl_sm_mon mo on mo.id = x.mon_id;
$$;

revoke all on function public.vkl_sm_ref_nhan(uuid, bigint, text, text) from public;
revoke all on function public.vkl_sm_keo_bang() from public;
revoke all on function vkl_priv.sm_ref_tick() from public;
grant execute on function public.vkl_sm_ref_nhan(uuid, bigint, text, text) to anon, authenticated;
grant execute on function public.vkl_sm_keo_bang() to anon, authenticated;

select cron.schedule('vkl_sm_ref_tick', '7 * * * *', 'select vkl_priv.sm_ref_tick()');
