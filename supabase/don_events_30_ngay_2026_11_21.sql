-- 21/11 (Tyler đồng ý 20/11 đêm): dọn vkl_events quá 30 ngày, mỗi đêm 3:40 giờ VN, tối đa 200.000 dòng một lần (khoảng 2,5 ngày dữ liệu, tránh khóa lâu).
-- Số theo ngày đã gom sẵn ở vkl_daily (giữ nguyên). Hàm và cron MỚI, không sửa hàm cũ.
create or replace function vkl_priv.ev_don_30()
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  with x as (select id from public.vkl_events where created_at < now() - interval '30 days' order by created_at limit 200000)
  delete from public.vkl_events e using x where e.id = x.id;
  get diagnostics n = row_count;
  return n;
end;
$$;
revoke all on function vkl_priv.ev_don_30() from public, anon, authenticated;
select cron.unschedule(jobid) from cron.job where jobname = 'vkl_ev_don_30';
select cron.schedule('vkl_ev_don_30', '40 20 * * *', 'select vkl_priv.ev_don_30()');
