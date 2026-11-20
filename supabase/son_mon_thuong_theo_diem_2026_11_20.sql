-- 20/11 23h (Tyler: "check xem đồ của sơn môn có đúng ko"):
-- Luật Kỷ 2 công bố "hết Kỷ, môn nhiều Điểm giữ đất nhất thắng; bằng điểm xét số ô rồi tổng Khí vận" (vkl_sm_rank2),
-- nhưng phần thưởng còn xếp hạng môn theo số ô rồi Khí vận:
--   * sm_thuong_tinh (xem trước pháp bảo ở màn Phần thưởng Kỷ, và phát thật) xếp môn theo so_o, kv khi chưa kết Kỷ.
--   * sm_ket_ky (lúc kết Kỷ ghi vkl_sm_ky_kq: hạng, khắc tên Sổ Sinh Tử, khung vàng) xếp theo o, kv.
-- Sửa bằng hàm mới (không sửa hàm cũ): thêm điểm làm tiêu chí đầu.
--   sm_thuong_tinh2, vkl_sm_cong_bang2 (client gọi, lỗi thì về bản cũ), sm_ket_ky2 + sm_ket_ky_tick2, sm_phat_thuong3 + sm_phat_tick3.
--   Hai cron vkl_sm_ket_ky và vkl_sm_phat_thuong đổi sang hàm tick mới.

create or replace function vkl_priv.sm_thuong_tinh2(p_ky integer)
returns table(player_id uuid, mon_id bigint, o text, loai text, pham text, hang_mon integer, hang_cong integer, them_pct integer, ten text, khac text)
language sql stable security definer set search_path = '' as $$
  with k as (
    select id, ket_thuc, vkl_priv.sm_day(bat_dau) d0, vkl_priv.sm_day(ket_thuc) d1 from public.vkl_sm_ky where id = p_ky
  ), mon0 as (
    select m.id, m.ten, m.ten1, m.ten2, m.mon_chu, m.lap_luc, q.hang,
      coalesce((select dm.diem from public.vkl_sm_diem dm where dm.ky_id = p_ky and dm.mon_id = m.id), 0) diem,
      (select count(*) from public.vkl_sm_tile t where t.ky_id = p_ky and t.mon_id = m.id) so_o,
      (select coalesce(sum(n.khi_van), 0) from public.vkl_sm_ngay n, k where n.mon_id = m.id and n.ngay between k.d0 and k.d1) kv
    from public.vkl_sm_mon m
    left join public.vkl_sm_ky_kq q on q.ky_id = p_ky and q.mon_id = m.id
    where m.ky_lap = p_ky and m.giai_tan_luc is null and m.du_ky and vkl_priv.sm_mon_n(m.id) >= 3
  ), mon as (
    select m.*, row_number() over (order by m.hang nulls last, m.diem desc, m.so_o desc, m.kv desc, m.lap_luc, m.id)::int hm from mon0 m
  ), cong as (
    select c.player_id, c.mon_id, c.cong from vkl_priv.sm_cong_ds(p_ky) c
  ), nguoi as (
    select mb.player_id, mb.mon_id, mb.chuc, mb.vao_luc, c.cong
    from public.vkl_sm_member mb
    join mon on mon.id = mb.mon_id
    join public.vkl_players p on p.id = mb.player_id
    join cong c on c.player_id = mb.player_id and c.mon_id = mb.mon_id
    cross join k
    where mb.vao_luc <= k.ket_thuc - interval '3 days'
      and p.created_at <= k.ket_thuc - interval '7 days'
      and c.cong >= 10
      and not exists (select 1 from vkl_priv.lb_hidden h where h.username = p.username)
  ), rk as (
    select n.*, row_number() over (partition by n.mon_id order by n.cong desc, n.vao_luc, n.player_id)::int rk from nguoi n
  ), lead as (
    select distinct on (r.mon_id) r.mon_id, r.player_id, r.rk
    from rk r join mon on mon.id = r.mon_id
    where r.player_id = mon.mon_chu or r.chuc = 'lao'
    order by r.mon_id, (r.player_id = mon.mon_chu) desc, r.cong desc, r.rk
  ), vk as (
    select r.player_id, r.mon_id, r.rk,
      case when l.player_id = r.player_id and r.rk > 7 then 'tran_mon_kiem'
           else (array['kiem', 'dao', 'thuong', 'quat', 'phat_tran', 'cung', 'song_chuy'])[r.rk] end loai
    from rk r left join lead l on l.mon_id = r.mon_id
    where r.player_id = l.player_id
       or r.rk <= case when l.player_id is not null and l.rk > 7 then 6 else 7 end
  ), items as (
    select v.player_id, v.mon_id, 'vu_khi' o, v.loai, v.rk from vk v
    union all
    select l.player_id, l.mon_id, 'phu_kien', 'an', l.rk from lead l
  )
  select i.player_id, i.mon_id, i.o, i.loai, ph.pham, mon.hm, i.rk,
    least(25, vkl_priv.sm_bv_pct(ph.pham)
      + case when i.o = 'vu_khi' and i.loai <> 'tran_mon_kiem' then case when i.rk = 1 then 3 when i.rk <= 3 then 2 else 0 end else 0 end),
    (case ph.pham when 'than' then 'Thần phẩm ' when 'tien' then 'Tiên phẩm ' when 'linh' then 'Linh phẩm ' when 'bao' then 'Bảo phẩm ' else 'Phàm phẩm ' end)
      || case i.loai
           when 'tran_mon_kiem' then 'Trấn Môn Kiếm'
           when 'an' then mon.ten1 || ' ' || mon.ten2 || ' Chưởng Môn Ấn'
           else mon.ten1 || ' ' || mon.ten2 || ' ' || case i.loai when 'kiem' then 'Kiếm' when 'dao' then 'Đao' when 'thuong' then 'Thương'
             when 'quat' then 'Quạt' when 'phat_tran' then 'Phất Trần' when 'cung' then 'Cung' else 'Song Chùy' end
         end,
    mon.ten || ' - Kỷ ' || p_ky
  from items i
  join mon on mon.id = i.mon_id
  cross join lateral (select case when mon.hm = 1 then 'than' when mon.hm = 2 then 'tien' when mon.hm = 3 then 'linh'
                                  when mon.hm <= 10 then 'bao' else 'pham' end pham) ph;
$$;
revoke all on function vkl_priv.sm_thuong_tinh2(integer) from public;

create or replace function public.vkl_sm_cong_bang2(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_ky int; v_mon bigint; k public.vkl_sm_ky; v jsonb;
begin
  select id into v_ky from public.vkl_sm_ky where bat_dau <= now() order by id desc limit 1;
  select * into k from public.vkl_sm_ky where id = v_ky;
  select mon_id into v_mon from public.vkl_sm_member where player_id = v_me;
  if v_ky is null then return jsonb_build_object('ky', null); end if;
  with c as (
    select * from vkl_priv.sm_cong_ds(v_ky) where mon_id = v_mon
  ), t as (
    select * from vkl_priv.sm_thuong_tinh2(v_ky)
  ), ds as (
    select mb.player_id, p.username, coalesce(p.meta -> 'chanThan' ->> 'name', p.username) ten, mb.chuc, mb.vao_luc,
      coalesce(c.cong, 0) cong, c.dd, c.nv, c.kh, c.xc, c.giu,
      row_number() over (order by coalesce(c.cong, 0) desc, mb.vao_luc, mb.player_id)::int hang
    from public.vkl_sm_member mb join public.vkl_players p on p.id = mb.player_id
    left join c on c.player_id = mb.player_id
    where mb.mon_id = v_mon
  )
  select jsonb_build_object(
    'ky', jsonb_build_object('id', k.id, 'ket_thuc', k.ket_thuc, 'ket_xong', k.ket_xong,
                             'khoa', k.ket_thuc - interval '3 days'),
    'ds', coalesce((select jsonb_agg(jsonb_build_object('ten', d.ten, 'tk', d.username, 'chuc', d.chuc, 'cong', d.cong,
                       'hang', d.hang, 'ta', d.player_id = v_me,
                       'nhan', (select jsonb_agg(jsonb_build_object('o', t.o, 'loai', t.loai, 'pham', t.pham)) from t where t.player_id = d.player_id))
                     order by d.hang) from ds d), '[]'::jsonb),
    'ta', (select jsonb_build_object('hang', d.hang, 'cong', d.cong, 'dd', coalesce(d.dd, 0), 'nv', coalesce(d.nv, 0), 'kh', coalesce(d.kh, 0),
                    'xc', coalesce(d.xc, 0), 'giu', coalesce(d.giu, 0), 'vao_som', d.vao_luc <= k.ket_thuc - interval '3 days')
           from ds d where d.player_id = v_me),
    'nhan', coalesce((select jsonb_agg(jsonb_build_object('o', t.o, 'loai', t.loai, 'pham', t.pham, 'pct', t.them_pct, 'ten', t.ten, 'hang_cong', t.hang_cong))
                      from t where t.player_id = v_me), '[]'::jsonb),
    'mon_hang', (select min(t.hang_mon) from t where t.mon_id = v_mon),
    'mon_du', exists (select 1 from public.vkl_sm_mon m where m.id = v_mon and m.du_ky and m.giai_tan_luc is null and vkl_priv.sm_mon_n(m.id) >= 3),
    'tk_du', (select p.created_at <= k.ket_thuc - interval '7 days' from public.vkl_players p where p.id = v_me),
    'can', 10
  ) into v;
  return v;
end;
$$;
revoke all on function public.vkl_sm_cong_bang2(uuid) from public;
grant execute on function public.vkl_sm_cong_bang2(uuid) to anon, authenticated;

create or replace function vkl_priv.sm_ket_ky2(p_ky integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  k public.vkl_sm_ky; r record; v_n_tran int := 0; v_tom jsonb; v_d0 date; v_d1 date;
begin
  select * into k from public.vkl_sm_ky where id = p_ky for update;
  if k.id is null then raise exception 'SM_KY'; end if;
  if k.ket_xong then return coalesce(k.ket_tom, '{}'::jsonb) || jsonb_build_object('da_ket', true); end if;

  for r in select * from public.vkl_sm_chinh where ky_id = p_ky and trang_thai in ('tap_hop', 'di')
             and toi_noi_luc <= k.ket_thuc order by toi_noi_luc, id for update loop
    if r.trang_thai = 'tap_hop' then
      if exists (select 1 from public.vkl_sm_chinh_theo where chinh_id = r.id) then
        update public.vkl_sm_chinh set trang_thai = 'di' where id = r.id;
      else
        update public.vkl_sm_chinh set trang_thai = 'huy', ket_qua = '{"kq":"huy","ly_do":"khong_nguoi"}' where id = r.id;
        continue;
      end if;
    end if;
    perform vkl_priv.sm_tran(r.id);
    v_n_tran := v_n_tran + 1;
  end loop;

  v_d0 := vkl_priv.sm_day(k.bat_dau);
  v_d1 := vkl_priv.sm_day(k.ket_thuc);
  -- 20/11: xếp như vkl_sm_rank2: Điểm giữ đất, rồi số ô, rồi tổng Khí vận cả Kỷ. Yêu thú không xếp.
  insert into public.vkl_sm_ky_kq (ky_id, mon_id, hang, so_o, khi_van, so_nguoi, ten, huy_hieu, khac_ten, khung_vang)
  select p_ky, x.id, x.hang, x.o, x.kv, x.n, x.ten, x.huy_hieu, x.hang = 1 and (x.o > 0 or x.diem > 0), x.hang in (2, 3) and (x.o > 0 or x.diem > 0)
  from (
    select y.*, row_number() over (order by y.diem desc, y.o desc, y.kv desc, y.lap_luc, y.id)::int hang
    from (
      select m.id, m.ten, m.huy_hieu, m.lap_luc,
        coalesce((select dm.diem from public.vkl_sm_diem dm where dm.ky_id = p_ky and dm.mon_id = m.id), 0) diem,
        (select count(*) from public.vkl_sm_tile t where t.ky_id = p_ky and t.mon_id = m.id)::int o,
        (select coalesce(sum(n.khi_van), 0) from public.vkl_sm_ngay n where n.mon_id = m.id and n.ngay between v_d0 and v_d1)::int kv,
        vkl_priv.sm_mon_n(m.id) n
      from public.vkl_sm_mon m where m.ky_lap = p_ky and m.giai_tan_luc is null and m.id is distinct from vkl_priv.sm_yeu_mon()
    ) y
  ) x
  on conflict (ky_id, mon_id) do nothing;

  insert into public.vkl_sm_thuong (player_id, ky_id, loai)
  select mb.player_id, p_ky, case when q.hang = 1 then 'hang1' else 'hang2_3' end
  from public.vkl_sm_ky_kq q join public.vkl_sm_member mb on mb.mon_id = q.mon_id
  where q.ky_id = p_ky and (q.khac_ten or q.khung_vang)
  on conflict do nothing;

  insert into public.vkl_sm_thuong (player_id, ky_id, loai)
  select d.player_id, p_ky, 'chuoi7' from public.vkl_sm_diem_danh d
  where d.ngay between v_d0 and v_d1 group by d.player_id having count(distinct d.ngay) >= 7
  on conflict do nothing;

  update public.vkl_sm_chinh set trang_thai = 'huy', ket_qua = coalesce(ket_qua, '{}'::jsonb) || '{"kq":"huy","ly_do":"het_ky"}'
   where ky_id = p_ky and trang_thai in ('tap_hop', 'di');
  update public.vkl_sm_yeu_cong set trang_thai = 'huy', ket_qua = '{"kq":"huy","ly_do":"het_ky"}' where ky_id = p_ky and trang_thai = 'cho';
  update public.vkl_sm_trinh set ket_qua = '{"het_ky":true}' where ky_id = p_ky and ket_qua is null;
  update public.vkl_sm_tile set mon_id = null, chinh_dien = false, bao_ho_toi = null, chiem_luc = null
   where ky_id = p_ky and (mon_id is not null or bao_ho_toi is not null or chinh_dien);
  update public.vkl_sm_member mb set dung_q = null, dung_r = null, nghi_toi = null
    from public.vkl_sm_mon m where m.id = mb.mon_id and m.ky_lap = p_ky;
  update public.vkl_sm_member set khoa_toi = null where khoa_toi is not null;
  update public.vkl_sm_mon set cam_co_luc = null where ky_lap = p_ky and cam_co_luc is not null;

  v_tom := jsonb_build_object('tran', v_n_tran,
    'mon', (select count(*) from public.vkl_sm_ky_kq where ky_id = p_ky),
    'hang1', (select mon_id from public.vkl_sm_ky_kq where ky_id = p_ky and khac_ten),
    'xep_theo', 'diem',
    'thuong', (select jsonb_object_agg(loai, n) from (select loai, count(*) n from public.vkl_sm_thuong where ky_id = p_ky group by loai) z));
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, noi_dung)
  values (p_ky, 'ket_ky', (select mon_id from public.vkl_sm_ky_kq where ky_id = p_ky and hang = 1), v_tom);
  update public.vkl_sm_ky set ket_xong = true, ket_luc = now(), ket_tom = v_tom where id = p_ky;
  return v_tom;
end;
$$;

create or replace function vkl_priv.sm_ket_ky_tick2()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record; v_out jsonb := '[]';
begin
  for r in select id from public.vkl_sm_ky where not ket_xong and ket_thuc <= now() order by id loop
    v_out := v_out || jsonb_build_array(jsonb_build_object('ky', r.id, 'kq', vkl_priv.sm_ket_ky2(r.id)));
  end loop;
  return v_out;
end;
$$;

create or replace function vkl_priv.sm_phat_thuong3(p_ky integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare v_n int;
begin
  if not exists (select 1 from public.vkl_sm_ky where id = p_ky and ket_xong) then raise exception 'SM_KY_CHUA_KET'; end if;
  with ins as (
    insert into public.vkl_sm_bao_vat (player_id, ky_id, mon_id, o, loai, pham, hang_mon, hang_cong, them_pct, ten, khac)
    select t.player_id, p_ky, t.mon_id, t.o, t.loai, t.pham, t.hang_mon, t.hang_cong, t.them_pct, t.ten, t.khac
    from vkl_priv.sm_thuong_tinh2(p_ky) t
    on conflict (player_id, ky_id, o) do nothing
    returning player_id, ten
  ), thu as (
    insert into public.vkl_mail (to_player, from_player, kind, body)
    select p.username, null, 'thien_dao',
      'Kỷ ' || p_ky || ' đã khép lại. Sơn Môn ghi công đạo hữu, ban: ' || string_agg(i.ten, ', ') ||
      '. Mở tab Nhân vật, chạm ô Vũ khí hoặc Phụ kiện để lắp vào chân thân. Pháp bảo dùng mãi, lắp vào là cộng Tu vi.'
    from ins i join public.vkl_players p on p.id = i.player_id group by p.username
    returning 1
  )
  select count(*) into v_n from ins;
  insert into public.vkl_sm_bv_phat (ky_id, n) values (p_ky, v_n)
  on conflict (ky_id) do update set n = public.vkl_sm_bv_phat.n + excluded.n, luc = now();
  return v_n;
end;
$$;

create or replace function vkl_priv.sm_phat_tick3()
returns integer language plpgsql security definer set search_path = '' as $$
declare r record; v int := 0;
begin
  for r in select k.id from public.vkl_sm_ky k where k.ket_xong and not exists (select 1 from public.vkl_sm_bv_phat p where p.ky_id = k.id) loop
    v := v + vkl_priv.sm_phat_thuong3(r.id);
  end loop;
  return v;
end;
$$;

revoke all on function vkl_priv.sm_ket_ky2(integer) from public;
revoke all on function vkl_priv.sm_ket_ky_tick2() from public;
revoke all on function vkl_priv.sm_phat_thuong3(integer) from public;
revoke all on function vkl_priv.sm_phat_tick3() from public;

select cron.alter_job((select jobid from cron.job where jobname = 'vkl_sm_ket_ky'), command := 'select vkl_priv.sm_ket_ky_tick2()');
select cron.alter_job((select jobid from cron.job where jobname = 'vkl_sm_phat_thuong'), command := 'select vkl_priv.sm_phat_tick3()');
