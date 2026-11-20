-- 20/11 (Tyler): tin Sơn Môn trên bảng tin trang chủ: môn mới lập, môn mở rộng đất, môn đánh ô (thắng/thua), diệt yêu thú,
-- giành Linh Mạch/Thiên Trì, yêu thú xuất hiện, môn mất hết đất. Gọi qua /api/pub/live (bộ đệm Vercel 60 giây), nên cả máy chủ
-- chỉ chạy hàm này tối đa mỗi phút một lần. Bảng nhỏ, có sẵn chỉ mục (ky_id, luc).
create or replace function public.vkl_sm_tin_live()
returns jsonb language sql stable security definer set search_path = '' as $$
  with k as (select vkl_priv.sm_ky_now() id),
  yeu as (select vkl_priv.sm_yeu_mon() id),
  mon as (select m.id, m.ten from public.vkl_sm_mon m),
  bao as (
    select b.loai, b.luc, b.mon_a, b.mon_b, b.noi_dung nd, d.loai dat
      from public.vkl_sm_bao b join k on b.ky_id = k.id
      left join public.vkl_sm_dat d on d.ky_id = b.ky_id and d.q = b.q and d.r = b.r and d.loai in ('linh_mach', 'thien_tri')
     where b.luc > now() - interval '6 hours' and b.loai in ('cam_co', 'tran', 'mat_het')
     order by b.luc desc limit 16),
  x as (
    select jsonb_build_object('k', 'sm',
             't', case when b.loai = 'cam_co' then 'mo'
                       when b.loai = 'mat_het' then 'mat'
                       when b.mon_b = (select id from yeu) then case when b.nd ->> 'kq' = 'thang' then 'diet' else 'yeu_thua' end
                       when b.nd ->> 'kq' = 'thang' then 'chiem' else 'thua' end,
             'a', ma.ten, 'b', case when b.mon_b = (select id from yeu) then null else mb.ten end,
             'o', b.nd ->> 'ten_o', 'dat', b.dat, 'bo', b.nd ->> 'bo_o', 'at', b.luc) j, b.luc at
      from bao b left join mon ma on ma.id = b.mon_a left join mon mb on mb.id = b.mon_b
     where ma.ten is not null
    union all
    select jsonb_build_object('k', 'sm', 't', 'lap', 'a', m.ten, 'at', m.lap_luc), m.lap_luc
      from public.vkl_sm_mon m, k
     where m.ky_lap = k.id and m.giai_tan_luc is null and m.du_ky and m.lap_luc > now() - interval '24 hours'
       and m.id is distinct from (select id from yeu)
    union all
    select jsonb_build_object('k', 'sm', 't', 'yeu', 'n', count(*), 'at', max(d.yeu_luc_dat)), max(d.yeu_luc_dat)
      from public.vkl_sm_dat d, k
     where d.ky_id = k.id and d.loai = 'yeu_thu' and d.yeu_luc_dat > now() - interval '12 hours'
    having count(*) > 0)
  select coalesce(jsonb_agg(j order by at desc), '[]'::jsonb) from (select j, at from x order by at desc limit 14) y;
$$;
revoke all on function public.vkl_sm_tin_live() from public;
grant execute on function public.vkl_sm_tin_live() to anon, authenticated;
