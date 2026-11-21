-- 21/11 (Tyler: "quái hung dữ hơn theo giờ trong ngày, xem giờ chơi đông để quyết").
-- Số người chơi kiếp theo giờ (7 ngày tới 21/11, giờ VN): đông nhất 21-24h (200-233 người/giờ), ban ngày 9-18h 130-160,
-- 19-20h 186, vắng nhất 3-7h (43-70). Đợt yêu thú cũ 9, 12, 15, 18, 21 bỏ trống đúng giờ đông 22-23h.
-- Đổi (chỉ cấu hình + trigger mới + cron mới, không sửa hàm cũ):
--  * Giờ đánh thường: 9, 12, 15, 18, 20, 21, 22, 23. Thú triều (T4, T7): 8, 10, 12, 14, 16, 18, 20, 21, 22, 23. 0-7h không đánh.
--  * Lực đòn theo giờ tới (trigger trước khi ghi vkl_sm_yeu_cong): 9h x0,9; 10-19h x1; 20-21h x1,15; 22-23h x1,3.
--  * Số môn bị nhắm mỗi đợt: ngày 2 (thú triều 5), 20-23h thêm 1. Cron phút 57 đặt yeu_luot cho đợt sắp báo.
--  Giới hạn mỗi môn cách 6 giờ (thú triều 3 giờ) giữ nguyên, nên tối đánh nhiều môn hơn chứ không dồn một môn.

update public.vkl_sm_cfg set v = v || jsonb_build_object(
  'yeu_gio', '[9,12,15,18,20,21,22,23]'::jsonb,
  'yeu_gio_trieu', '[8,10,12,14,16,18,20,21,22,23]'::jsonb,
  'yeu_nhip', '{"he": {"9": 0.9, "20": 1.15, "21": 1.15, "22": 1.3, "23": 1.3}, "them": {"20": 1, "21": 1, "22": 1, "23": 1}}'::jsonb,
  'yeu_luot_goc', coalesce(v -> 'yeu_luot_goc', v -> 'yeu_luot'),
  'yeu_luot_trieu_goc', coalesce(v -> 'yeu_luot_trieu_goc', v -> 'yeu_luot_trieu'))
 where k = 'dat';

create or replace function vkl_priv.sm_yeu_he_gio()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_h text := extract(hour from new.toi_luc at time zone 'Asia/Ho_Chi_Minh')::int::text; v_he numeric;
begin
  select (v -> 'yeu_nhip' -> 'he' ->> v_h)::numeric into v_he from public.vkl_sm_cfg where k = 'dat';
  if v_he is not null and v_he <> 1 then
    new.luc := vkl_priv.sm_r500(new.luc * v_he, 5000);
  end if;
  return new;
end;
$$;
revoke all on function vkl_priv.sm_yeu_he_gio() from public, anon, authenticated;
drop trigger if exists vkl_sm_yeu_cong_gio on public.vkl_sm_yeu_cong;
create trigger vkl_sm_yeu_cong_gio before insert on public.vkl_sm_yeu_cong for each row execute function vkl_priv.sm_yeu_he_gio();

-- phút 57: đặt số môn bị nhắm cho đợt báo lúc HH+1:00 (đòn tới lúc HH+2:00)
create or replace function vkl_priv.sm_yeu_nhip()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare c jsonb; v_h int := (extract(hour from now() at time zone 'Asia/Ho_Chi_Minh')::int + 2) % 24; v_them int;
begin
  select v into c from public.vkl_sm_cfg where k = 'dat';
  v_them := coalesce((c -> 'yeu_nhip' -> 'them' ->> v_h::text)::int, 0);
  update public.vkl_sm_cfg set v = v || jsonb_build_object(
      'yeu_luot', coalesce((c ->> 'yeu_luot_goc')::int, 2) + v_them,
      'yeu_luot_trieu', coalesce((c ->> 'yeu_luot_trieu_goc')::int, 5) + v_them)
   where k = 'dat';
  return jsonb_build_object('gio', v_h, 'them', v_them);
end;
$$;
revoke all on function vkl_priv.sm_yeu_nhip() from public, anon, authenticated;
select cron.schedule('vkl_sm_yeu_nhip', '57 * * * *', 'select vkl_priv.sm_yeu_nhip()');
select vkl_priv.sm_yeu_nhip();
