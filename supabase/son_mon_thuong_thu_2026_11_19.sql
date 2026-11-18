-- 19/11 (Tyler): pháp bảo Sơn Môn không mất tác dụng, có chỉ số, lắp vào chân thân (tab Nhân vật).
-- Hàm MỚI thay cho sm_phat_thuong / sm_phat_tick (chỉ đổi lời thư), cron vkl_sm_phat_thuong chuyển sang hàm mới.
create or replace function vkl_priv.sm_phat_thuong2(p_ky int)
returns int language plpgsql security definer set search_path = '' as $$
declare v_n int;
begin
  if not exists (select 1 from public.vkl_sm_ky where id = p_ky and ket_xong) then raise exception 'SM_KY_CHUA_KET'; end if;
  with ins as (
    insert into public.vkl_sm_bao_vat (player_id, ky_id, mon_id, o, loai, pham, hang_mon, hang_cong, them_pct, ten, khac)
    select t.player_id, p_ky, t.mon_id, t.o, t.loai, t.pham, t.hang_mon, t.hang_cong, t.them_pct, t.ten, t.khac
    from vkl_priv.sm_thuong_tinh(p_ky) t
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

create or replace function vkl_priv.sm_phat_tick2()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; v int := 0;
begin
  for r in select k.id from public.vkl_sm_ky k where k.ket_xong and not exists (select 1 from public.vkl_sm_bv_phat p where p.ky_id = k.id) loop
    v := v + vkl_priv.sm_phat_thuong2(r.id);
  end loop;
  return v;
end;
$$;

revoke all on function vkl_priv.sm_phat_thuong2(int) from public;
revoke all on function vkl_priv.sm_phat_tick2() from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function vkl_priv.sm_phat_thuong2(int) from anon, authenticated;
    revoke all on function vkl_priv.sm_phat_tick2() from anon, authenticated;
  end if;
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'vkl_sm_phat_thuong';
    perform cron.schedule('vkl_sm_phat_thuong', '*/10 * * * *', 'select vkl_priv.sm_phat_tick2()');
  end if;
end $$;
