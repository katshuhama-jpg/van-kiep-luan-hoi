-- Fanpage cấp mã khôi phục cho người chơi quên mật khẩu (Tyler chốt 4/11).
-- Cách dùng: thay TEN_DANG_NHAP bằng tên đăng nhập người chơi gửi, chạy trong Supabase > SQL Editor.
-- Kết quả trả về mã 12 ký tự (dạng ABCD-EFGH-JKMN). Nhắn mã đó cho người chơi:
-- họ vào Đăng nhập > Quên mật khẩu, nhập tên + mã + mật khẩu mới. Mã dùng một lần, mã cũ (nếu có) hết hiệu lực.
-- Không đụng mật khẩu, nhân vật, đồ đạc. Đừng bấm Save để mã không bị lưu lại trong SQL Editor.
with abc as (select 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'::text a),
raw as (
  select string_agg(substr((select a from abc), 1 + (get_byte(b, i) % 31), 1), '' order by i) code
  from (select extensions.gen_random_bytes(12) b) r, generate_series(0, 11) i
),
upd as (
  update public.vkl_players p
  set recovery_hash = extensions.crypt((select code from raw), extensions.gen_salt('bf')), recovery_at = now(), failed = 0, locked_until = null
  where p.username = lower(trim('TEN_DANG_NHAP'))
  returning p.username
)
select u.username, substr(r.code, 1, 4) || '-' || substr(r.code, 5, 4) || '-' || substr(r.code, 9, 4) as ma_khoi_phuc
from upd u, raw r;
-- Không ra dòng nào nghĩa là sai tên đăng nhập.
