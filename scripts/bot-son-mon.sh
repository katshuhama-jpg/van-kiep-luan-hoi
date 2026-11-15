#!/usr/bin/env bash
# 4.6.0 Sơn Môn, Ngày 6: thử toàn bộ một Kỷ rút gọn 2 giờ với 30 bot trên Postgres CỤC BỘ.
# Đồng hồ chia 20: không chờ thật, các mốc (tập hợp 30 phút, đi 20 phút, hết hạn ký 24 giờ, hết Kỷ) được tua bằng
# cách sửa thời điểm trong bảng rồi gọi tay vkl_priv.sm_tick() / vkl_priv.sm_ket_ky_tick() (cục bộ không có pg_cron).
#
# Chuẩn bị (CSDL trống):
#   psql -d vkl -f <schema tối thiểu: vkl_players, vkl_sessions, vkl_lives (có realm_no), vkl_player(token)>
#   psql -d vkl -f supabase/son_mon_gon_2026_11_15.sql
#   psql -d vkl -f supabase/son_mon_ket_ky_2026_11_16.sql
# Chạy:  DB="host=/tmp/pg6-ngay6 port=5436 user=postgres dbname=vkl" bash scripts/bot-son-mon.sh
# KHÔNG chạy lên Supabase thật: script tự dừng nếu CSDL có tài khoản không phải bot.
set -u
DB="${DB:-host=/tmp/pg6-ngay6 port=5436 user=postgres dbname=vkl}"
PASS=0; FAIL=0; RESULTS=()

run() { psql "$DB" -X -q -tA -v ON_ERROR_STOP=1 -c "$1" 2>&1; }
tk() { printf "'00000000-0000-4000-8000-%012d'::uuid" "$1"; }
pid() { printf "'10000000-0000-4000-8000-%012d'::uuid" "$1"; }
ghi() { # ghi kết quả một bước
  if [ "$2" = ok ]; then PASS=$((PASS + 1)); RESULTS+=("ĐẠT   | $1"); else FAIL=$((FAIL + 1)); RESULTS+=("KHÔNG | $1 ($3)"); fi
}
check() { local o; o=$(run "select ($2)::boolean"); if [ "$o" = t ]; then ghi "$1" ok; else ghi "$1" no "$o"; fi; }
expect_err() { local o; o=$(run "$3"); if echo "$o" | grep -q "$2"; then ghi "$1" ok; else ghi "$1" no "chờ $2, ra: $o"; fi; }
expect_ok() { local o; o=$(run "$2"); if echo "$o" | grep -q ERROR; then ghi "$1" no "$o"; else ghi "$1" ok; fi; }
ky() { run "select max(id) from vkl_sm_ky"; }
mon() { run "select id from vkl_sm_mon where mon_chu = $(pid "$1") order by id desc limit 1"; }

# ---------- an toàn: chỉ CSDL thử ----------
la=$(run "select count(*) from vkl_players where username !~ '^bot[0-9]{2}\$'")
if [ "$la" != 0 ]; then echo "Dừng: CSDL có $la tài khoản không phải bot (không chạy trên dữ liệu thật)."; exit 2; fi

# ---------- 0. dọn và dựng 30 bot ----------
run "truncate vkl_sm_ky, vkl_sm_co, vkl_sm_luc_chien, vkl_sm_member, vkl_sm_diem_danh, vkl_sm_nv, vkl_sm_ky_kq cascade;
     delete from vkl_sm_admin_user where username like 'bot%'; delete from vkl_lives; delete from vkl_sessions; delete from vkl_players;" >/dev/null
for i in $(seq 1 30); do
  run "insert into vkl_players (id, username, meta, created_at) values ($(pid "$i"), 'bot$(printf %02d "$i")',
        jsonb_build_object('chanThan', jsonb_build_object('name', 'Bot $i')), now() - interval '1 day');
       insert into vkl_sessions (token, player_id) values ($(tk "$i"), $(pid "$i"));" >/dev/null
done
# Người lập môn (1, 2, 3, 9): 55 kiếp trải 6 ngày, sống lâu. Bot 1 mạnh nhất. Người khác: 3-8 kiếp trong 2 ngày.
for i in 1 2 3 9; do
  age=$([ "$i" = 1 ] && echo 400 || echo 150)
  run "insert into vkl_lives (player_id, player_name, char_name, age, realm, realm_no, created_at)
       select $(pid "$i"), 'bot', 'x', $age, 'r', 5, now() - make_interval(days => g % 6) - interval '1 hour' from generate_series(1, 55) g" >/dev/null
done
for i in $(seq 4 30); do
  [ "$i" = 9 ] && continue
  n=$((3 + i % 6)); age=$((40 + i * 3))
  run "insert into vkl_lives (player_id, player_name, char_name, age, realm, realm_no, created_at)
       select $(pid "$i"), 'bot', 'x', $age, 'r', 2, now() - make_interval(days => g % 2) - interval '1 hour' from generate_series(1, $n) g" >/dev/null
done
check "Lực chiến qua trigger khi ghi kiếp (30 bot)" "(select count(*) from vkl_sm_luc_chien) = 30 and (select min(lc) from vkl_sm_luc_chien) > 0"
check "Bot 1 mạnh nhất" "(select player_id from vkl_sm_luc_chien order by lc desc limit 1) = $(pid 1)"

# ---------- 1. Kỷ rút gọn 2 giờ ----------
run "select vkl_priv.sm_ky_create(now() - interval '1 minute', now() + interval '2 hour', 6)" >/dev/null
K=$(ky)
check "Tạo Kỷ 2 giờ, bản đồ 127 ô" "(select count(*) from vkl_sm_tile where ky_id = $K) = 127 and vkl_priv.sm_ky_now() = $K"

# ---------- 2. Lập môn ----------
expect_err "Chặn lập môn khi chưa đủ 50 kiếp + 5 ngày" SM_CHUA_DU_LAP "select vkl_sm_found($(tk 30), 'Thanh', 'Hư', 'Tông', 0, 0)"
expect_err "Chặn tên ngoài danh sách" SM_TEN "select vkl_sm_found($(tk 1), 'Abc', 'Hư', 'Tông', 0, 0)"
expect_ok "Bot 1 lập Thanh Hư Tông (mở cửa)" "select vkl_sm_found($(tk 1), 'Thanh', 'Hư', 'Tông', 3, 1)"
expect_err "Chặn trùng tên" SM_TRUNG_TEN "select vkl_sm_found($(tk 2), 'Thanh', 'Hư', 'Tông', 0, 0)"
expect_ok "Bot 2 lập Huyền Lôi Môn" "select vkl_sm_found($(tk 2), 'Huyền', 'Lôi', 'Môn', 7, 2)"
expect_ok "Bot 3 lập Tử Kiếm Phái (duyệt đơn)" "select vkl_sm_found($(tk 3), 'Tử', 'Kiếm', 'Phái', 12, 3, 0, 0, false)"
expect_ok "Bot 9 lập Bích Hà Cung (sẽ thiếu chữ ký)" "select vkl_sm_found($(tk 9), 'Bích', 'Hà', 'Cung', 20, 4)"
A=$(mon 1); B=$(mon 2); C=$(mon 3); D=$(mon 9)

# ---------- 3. Ký cùng lập ----------
expect_err "Chặn tự ký môn của mình" SM_TU_KY "select vkl_sm_cosign($(tk 1), $A)"
expect_ok "Bot 4 ký A" "select vkl_sm_cosign($(tk 4), $A)"
expect_ok "Bot 5 ký A" "select vkl_sm_cosign($(tk 5), $A)"
expect_ok "Bot 4 ký B" "select vkl_sm_cosign($(tk 4), $B)"
expect_err "Chặn ký quá 2 môn mỗi Kỷ" SM_KY_NHIEU "select vkl_sm_cosign($(tk 4), $C)"
expect_ok "Bot 6 ký B" "select vkl_sm_cosign($(tk 6), $B)"
expect_ok "Bot 8 ký C" "select vkl_sm_cosign($(tk 8), $C)"
expect_ok "Bot 10 ký C" "select vkl_sm_cosign($(tk 10), $C)"
expect_ok "Bot 11 ký D (một chữ ký)" "select vkl_sm_cosign($(tk 11), $D)"
check "A, B, C đủ chữ ký; D chưa" "(select bool_and(du_ky) from vkl_sm_mon where id in ($A, $B, $C)) and not (select du_ky from vkl_sm_mon where id = $D)"

# ---------- 4. Vào môn ----------
for i in $(seq 4 16); do [ "$i" = 9 ] && continue; run "select vkl_sm_join($(tk "$i"), $A)" >/dev/null; done
run "select vkl_sm_join($(tk 28), $A)" >/dev/null
run "update vkl_players set created_at = now() where id in ($(pid 17), $(pid 18), $(pid 19), $(pid 20))" >/dev/null
for i in $(seq 17 22); do run "select vkl_sm_join($(tk "$i"), $B)" >/dev/null; done
check "13 bot vào A mở cửa (A có 14 người)" "vkl_priv.sm_mon_n($A) = 14"
run "select vkl_sm_join($(tk 29), $A)" >/dev/null; run "select vkl_sm_join($(tk 30), $A)" >/dev/null
expect_err "Chặn vào môn đã đầy 15 người" SM_DAY "select vkl_sm_join($(tk 24), $A)"
expect_err "Môn chủ D đang có môn thì không vào môn khác" SM_DA_CO_MON "select vkl_sm_join($(tk 9), $A)"
check "Cờ nghi gian lận: tài khoản mới vào cùng môn (moi_vao_dong)" "exists (select 1 from vkl_sm_co where loai = 'moi_vao_dong')"
check "Cờ nghi gian lận: tài khoản mới ký lập môn (ky_moi)" "exists (select 1 from vkl_sm_co where loai = 'ky_moi')"
expect_err "Môn duyệt đơn chặn vào thẳng" SM_CAN_DON "select vkl_sm_join($(tk 23), $C)"
for i in 23 24 25 26 27; do run "select vkl_sm_apply($(tk "$i"), $C)" >/dev/null; done
for d in $(run "select id from vkl_sm_don where mon_id = $C and trang_thai = 'cho' order by id"); do
  run "select vkl_sm_accept($(tk 3), $d, true)" >/dev/null
done
check "Xin vào + môn chủ nhận: C có 6 người" "vkl_priv.sm_mon_n($C) = 6"
expect_ok "Môn chủ A phong bot 4 làm trưởng lão" "select vkl_sm_role($(tk 1), 'bot04', 'lao')"

# ---------- 5. Cắm cờ ô đầu ----------
expect_err "Đệ tử không cắm cờ được" SM_QUYEN "select vkl_sm_pick_tile($(tk 5), 0, 0)"
expect_ok "A cắm cờ (0,0)" "select vkl_sm_pick_tile($(tk 1), 0, 0)"
expect_ok "B cắm cờ (2,0)" "select vkl_sm_pick_tile($(tk 2), 2, 0)"
expect_ok "C cắm cờ (-4,2)" "select vkl_sm_pick_tile($(tk 3), -4, 2)"
expect_ok "D cắm cờ (-6,6)" "select vkl_sm_pick_tile($(tk 9), -6, 6)"
expect_err "Chặn cắm ô đã có chủ" SM_DA_CO_O "select vkl_sm_pick_tile($(tk 1), 3, 0)"
check "Cắm cờ đầu không có bảo hộ" "(select bao_ho_toi is null from vkl_sm_tile where ky_id = $K and q = 0 and r = 0)"

# ---------- 6. Điểm danh ----------
ok=0
for i in $(seq 1 30); do o=$(run "select vkl_sm_checkin($(tk "$i"))"); echo "$o" | grep -q chuoi && ok=$((ok + 1)); done
check "Điểm danh: 29 bot có môn điểm danh được ($ok)" "$ok = 29"
expect_err "Chặn điểm danh lần hai trong ngày" SM_DA_DIEM_DANH "select vkl_sm_checkin($(tk 1))"
check "Khí vận A hôm nay = số người điểm danh (15)" "(select khi_van from vkl_sm_ngay where mon_id = $A and ngay = vkl_priv.sm_day()) = 15"

# ---------- 7. Nhiệm vụ qua trigger khi ghi kiếp ----------
kv0=$(run "select khi_van from vkl_sm_ngay where mon_id = $A and ngay = vkl_priv.sm_day()")
bac=$(run "select bac from vkl_sm_nv where player_id = $(pid 5) and ngay = vkl_priv.sm_day()")
run "insert into vkl_lives (player_id, player_name, char_name, age, realm, realm_no) values ($(pid 5), 'bot', 'x', 10, 'r', 1)" >/dev/null
check "Kiếp chết trước 16 tuổi không tính nhiệm vụ" "(select kiep from vkl_sm_nv where player_id = $(pid 5) and ngay = vkl_priv.sm_day()) = 0"
run "insert into vkl_lives (player_id, player_name, char_name, age, realm, realm_no) values ($(pid 5), 'bot', 'x', 330, 'r', 6)" >/dev/null
check "Bot 5 (bậc $bac) một kiếp 330 tuổi, Nguyên Anh: xong nhiệm vụ tuổi + cảnh giới" \
  "(select xong[2] and xong[3] from vkl_sm_nv where player_id = $(pid 5) and ngay = vkl_priv.sm_day())"
check "Khí vận A cộng đúng thưởng nhiệm vụ" \
  "(select khi_van from vkl_sm_ngay where mon_id = $A and ngay = vkl_priv.sm_day()) = $kv0 + (select (case when xong[1] then 2 else 0 end) + (case when xong[2] then 3 else 0 end) + (case when xong[3] then 5 else 0 end) from vkl_sm_nv where player_id = $(pid 5) and ngay = vkl_priv.sm_day())"
run "insert into vkl_lives (player_id, player_name, char_name, age, realm, realm_no) select $(pid 17), 'bot', 'x', 70, 'r', 3 from generate_series(1, 3)" >/dev/null
check "Bot 17 chơi 3 kiếp: xong nhiệm vụ số kiếp" "(select xong[1] from vkl_sm_nv where player_id = $(pid 17) and ngay = vkl_priv.sm_day())"

# ---------- 8. Đứng giữ ----------
expect_ok "Bot 18 đứng giữ ô (2,0) của B" "select vkl_sm_guard($(tk 18), 2, 0)"
expect_err "Chặn đứng giữ ô không của môn" SM_O_KHONG_CUA_TA "select vkl_sm_guard($(tk 18), 0, 0)"

# ---------- 9. Môn thiếu chữ ký quá 24 giờ tự giải tán (tua giờ) ----------
run "update vkl_sm_mon set het_han_ky = now() - interval '1 second' where id = $D" >/dev/null
run "select vkl_priv.sm_tick()" >/dev/null
check "D giải tán, ô về trống, người ra khỏi môn" "(select giai_tan_luc is not null from vkl_sm_mon where id = $D)
  and (select mon_id is null from vkl_sm_tile where ky_id = $K and q = -6 and r = 6) and vkl_priv.sm_mon_n($D) = 0"

# tua: ff <chinh> = hết tập hợp, tick, rồi tới nơi lúc <ts>, tick
ff() {
  run "update vkl_sm_chinh set tap_hop_toi = now() - interval '1 second' where id = $1" >/dev/null
  run "select vkl_priv.sm_tick()" >/dev/null
  run "update vkl_sm_chinh set toi_noi_luc = $2 where id = $1" >/dev/null
  run "select vkl_priv.sm_tick()" >/dev/null
}
DAY="(((now() at time zone 'Asia/Ho_Chi_Minh')::date - 1 + time '12:00') at time zone 'Asia/Ho_Chi_Minh')"
NIGHT="(((now() at time zone 'Asia/Ho_Chi_Minh')::date - 1 + time '02:00') at time zone 'Asia/Ho_Chi_Minh')"
chinh() { run "select id from vkl_sm_chinh where mon_id = $1 order by id desc limit 1"; }

# ---------- 10. Xuất chinh cắm cờ ô trống ----------
expect_err "Chặn xuất chinh ô không kề" SM_KHONG_KE "select vkl_sm_march($(tk 1), 5, 0)"
expect_err "Đệ tử không phát lệnh" SM_QUYEN "select vkl_sm_march($(tk 6), 1, 0)"
expect_ok "B xuất chinh ô trống (3,0)" "select vkl_sm_march($(tk 2), 3, 0)"
CB=$(chinh "$B"); run "select vkl_sm_follow($(tk 19), $CB)" >/dev/null
ff "$CB" "$DAY"
check "B tới nơi cắm cờ (3,0)" "(select mon_id from vkl_sm_tile where ky_id = $K and q = 3 and r = 0) = $B"
expect_ok "A xuất chinh ô trống (1,0)" "select vkl_sm_march($(tk 1), 1, 0)"
CA=$(chinh "$A")
expect_err "Một môn một lệnh một lúc" SM_DANG_CHINH "select vkl_sm_march($(tk 4), -1, 0)"
for i in 5 6 7; do run "select vkl_sm_follow($(tk "$i"), $CA)" >/dev/null; done
expect_ok "Rút theo trước khi hết tập hợp" "select vkl_sm_unfollow($(tk 7), $CA)"
run "update vkl_sm_chinh set tap_hop_toi = now() - interval '1 second' where id = $CA" >/dev/null
run "select vkl_priv.sm_tick()" >/dev/null
check "Hết tập hợp thì lên đường (di), 3 người theo" "(select trang_thai from vkl_sm_chinh where id = $CA) = 'di' and (select count(*) from vkl_sm_chinh_theo where chinh_id = $CA) = 3"
expect_err "Hết tập hợp thì không theo được" SM_HET_TAP_HOP "select vkl_sm_follow($(tk 8), $CA)"
run "update vkl_sm_chinh set toi_noi_luc = $DAY where id = $CA" >/dev/null; run "select vkl_priv.sm_tick()" >/dev/null
check "A cắm cờ (1,0)" "(select mon_id from vkl_sm_tile where ky_id = $K and q = 1 and r = 0) = $A"

# ---------- 11. Trận ngày: A đánh ô chính điện (2,0) của B (Khí vận hôm trước A = 35 -> +10%) ----------
run "insert into vkl_sm_ngay (mon_id, ngay, khi_van) values ($A, vkl_priv.sm_day($DAY) - 1, 35) on conflict (mon_id, ngay) do update set khi_van = 35" >/dev/null
expect_ok "A phát lệnh đánh (2,0)" "select vkl_sm_march($(tk 1), 2, 0)"
CA=$(chinh "$A")
for i in 5 6 7 8 12 13 14; do run "select vkl_sm_follow($(tk "$i"), $CA)" >/dev/null; done
ff "$CA" "$DAY"
check "Trận ngày tính đúng: kv_a 0,1, không phải đêm, có kết quả thắng/thua" \
  "(select ket_qua ->> 'kv_a' = '0.10' and ket_qua ->> 'dem' = 'false' and ket_qua ->> 'kq' in ('thang', 'thua') from vkl_sm_chinh where id = $CA)"
check "A thắng, ô (2,0) đổi chủ, bảo hộ 6 giờ" \
  "(select mon_id = $A and bao_ho_toi between now() + interval '5 hour 59 minute' and now() + interval '6 hour 1 minute' from vkl_sm_tile where ky_id = $K and q = 2 and r = 0)"
check "B chọn lại chính điện (3,0); người đứng giữ ô mất về chính điện" \
  "(select chinh_dien from vkl_sm_tile where ky_id = $K and q = 3 and r = 0) and (select dung_q is null from vkl_sm_member where player_id = $(pid 18))"
expect_err "Bảo hộ: B không đánh lại được (2,0)" SM_BAO_HO "select vkl_sm_march($(tk 2), 2, 0)"

# ---------- 12. Trận đêm: trưởng lão A (bot 4) + bot 10 đánh (3,0) lúc 2:00 ----------
expect_ok "Trưởng lão phát lệnh" "select vkl_sm_march($(tk 4), 3, 0)"
CA=$(chinh "$A"); run "select vkl_sm_follow($(tk 10), $CA)" >/dev/null
raw=$(run "select lc from vkl_priv.sm_giu($K, $B, 3, 0)")
ff "$CA" "$NIGHT"
check "Trận đêm (tới nơi 0-7h): bên giữ x2 (x1,25 sân nhà x1,15 một ô)" \
  "(select ket_qua ->> 'dem' = 'true' and abs((ket_qua ->> 'def')::numeric - round($raw * 1.25 * 1.15 * 2 * (1 + (ket_qua ->> 'kv_b')::numeric))) <= 1 from vkl_sm_chinh where id = $CA)"
check "Bên đánh thua thì người theo nghỉ 2 giờ" \
  "(select ket_qua ->> 'kq' = 'thua' from vkl_sm_chinh where id = $CA) and (select nghi_toi > now() + interval '1 hour 59 minute' from vkl_sm_member where player_id = $(pid 10))"
expect_err "Người đang nghỉ không theo/không giữ được" SM_NGHI "select vkl_sm_guard($(tk 10), 0, 0)"

# ---------- 13. Môn mất hết ô ----------
expect_ok "A đánh (3,0) ban ngày với đủ quân" "select vkl_sm_march($(tk 1), 3, 0)"
CA=$(chinh "$A")
for i in 5 6 7 8 11 12 13 14 15 16 28 29 30; do run "select vkl_sm_follow($(tk "$i"), $CA)" >/dev/null; done
ff "$CA" "$DAY"
check "B mất hết ô, có chiến báo mat_het" "(select count(*) from vkl_sm_tile where mon_id = $B) = 0 and exists (select 1 from vkl_sm_bao where loai = 'mat_het' and mon_a = $B)"
check "B vẫn còn nguyên người" "vkl_priv.sm_mon_n($B) = 7"
expect_ok "B cắm cờ lại ô trống bất kỳ (không cần kề)" "select vkl_sm_pick_tile($(tk 2), -2, -3)"
check "Cắm lại sau khi mất hết: bảo hộ 12 giờ" \
  "(select bao_ho_toi between now() + interval '11 hour 59 minute' and now() + interval '12 hour 1 minute' from vkl_sm_tile where ky_id = $K and q = -2 and r = -3)"

# ---------- 14. Rời môn, đuổi ----------
expect_ok "Bot 16 tự rời A (đã cắm cờ)" "select vkl_sm_leave($(tk 16))"
check "Tự rời môn đã cắm cờ: khóa tới hết Kỷ" "(select khoa_toi = (select ket_thuc from vkl_sm_ky where id = $K) from vkl_sm_member where player_id = $(pid 16))"
expect_err "Bị khóa thì không vào môn khác" SM_KHOA "select vkl_sm_join($(tk 16), $B)"
expect_ok "Môn chủ A đuổi bot 15" "select vkl_sm_kick($(tk 1), 'bot15')"
expect_ok "Bị đuổi thì vào môn khác ngay" "select vkl_sm_join($(tk 15), $B)"

# ---------- 15. Chuẩn bị kết Kỷ ----------
# 7 ngày điểm danh: Kỷ thật dài 14 ngày; ở đây lùi giờ bắt đầu Kỷ 8 ngày và thêm 6 ngày điểm danh cũ cho bot 6 và 7.
run "update vkl_sm_ky set bat_dau = now() - interval '8 day' where id = $K;
     insert into vkl_sm_diem_danh (player_id, ngay, mon_id, chuoi) select p, vkl_priv.sm_day() - g, $A, 7 - g
       from unnest(array[$(pid 6), $(pid 7)]) p, generate_series(1, 6) g on conflict do nothing;
     insert into vkl_sm_diem_danh (player_id, ngay, mon_id, chuoi) select $(pid 8), vkl_priv.sm_day() - g, $A, 1 from generate_series(1, 4) g on conflict do nothing;
     insert into vkl_sm_thuong (player_id, ky_id, loai) values ($(pid 6), $K, 'chuoi7') on conflict do nothing;" >/dev/null
expect_ok "C phát lệnh (để còn lệnh đang chạy lúc hết Kỷ)" "select vkl_sm_march($(tk 3), -3, 2)"
expect_ok "Bot 1 trinh sát (5,0) (đang đi lúc hết Kỷ)" "select vkl_sm_scout($(tk 1), 5, 0)"
expect_ok "A phát lệnh cắm cờ (4,0), tới nơi trước giờ kết nhưng chưa ai tính" "select vkl_sm_march($(tk 1), 4, 0)"
CA=$(chinh "$A")
run "update vkl_sm_chinh set tap_hop_toi = now() - interval '10 second', toi_noi_luc = now() - interval '5 second' where id = $CA" >/dev/null
nA=$(run "select vkl_priv.sm_mon_n($A)"); nB=$(run "select vkl_priv.sm_mon_n($B)"); nC=$(run "select vkl_priv.sm_mon_n($C)")
oA=$(( $(run "select count(*) from vkl_sm_tile where mon_id = $A") + 1 ))
rank_before=$(run "select string_agg(x ->> 'id', ',') from jsonb_array_elements(vkl_sm_rank($K)) x")

# ---------- 16. Kết Kỷ (tua giờ kết thúc, gọi việc của job vkl_sm_ket_ky) ----------
check "Job kết Kỷ không làm gì khi Kỷ chưa hết giờ" "vkl_priv.sm_ket_ky_tick() = '[]'::jsonb"
run "update vkl_sm_ky set ket_thuc = now() - interval '1 second' where id = $K" >/dev/null
out=$(run "select vkl_priv.sm_ket_ky_tick()"); echo "ket_ky: $out"
check "Kỷ đánh dấu đã kết (ket_xong, ket_luc)" "(select ket_xong and ket_luc is not null from vkl_sm_ky where id = $K)"
check "Lệnh tới nơi trước giờ kết được tính khi kết Kỷ (cắm cờ (4,0))" "(select ket_qua ->> 'kq' = 'cam_co' from vkl_sm_chinh where id = $CA)"
check "Ghi kết quả 3 môn (môn đã giải tán không ghi)" "(select count(*) from vkl_sm_ky_kq where ky_id = $K) = 3 and not exists (select 1 from vkl_sm_ky_kq where mon_id = $D)"
check "Hạng 1 = A ($oA ô), được khắc tên" "(select mon_id = $A and so_o = $oA and khac_ten from vkl_sm_ky_kq where ky_id = $K and hang = 1)"
check "Xếp hạng khớp vkl_sm_rank trước khi kết (số ô, rồi tổng Khí vận)" \
  "(select string_agg(mon_id::text, ',' order by hang) from vkl_sm_ky_kq where ky_id = $K) = '$rank_before'"
check "B và C cùng 1 ô: môn nhiều Khí vận cả Kỷ đứng trên" \
  "(select bool_and(a.khi_van >= b.khi_van) from vkl_sm_ky_kq a join vkl_sm_ky_kq b on b.ky_id = a.ky_id and b.hang = a.hang + 1 and b.so_o = a.so_o where a.ky_id = $K)"
check "Hạng 2-3 có khung vàng" "(select count(*) from vkl_sm_ky_kq where ky_id = $K and hang in (2, 3) and khung_vang) = 2"
check "Hào quang hạng 1 cho mọi thành viên A ($nA)" "(select count(*) from vkl_sm_thuong where ky_id = $K and loai = 'hang1') = $nA"
check "Khung vàng hạng 2-3 cho thành viên B + C ($nB + $nC)" "(select count(*) from vkl_sm_thuong where ky_id = $K and loai = 'hang2_3') = $nB + $nC"
check "Đủ 7 ngày điểm danh nhận ngoại trang (bot 7), bot 6 đã có thì không trùng, bot 8 (5 ngày) không có" \
  "exists (select 1 from vkl_sm_thuong where ky_id = $K and loai = 'chuoi7' and player_id = $(pid 7))
   and (select count(*) from vkl_sm_thuong where ky_id = $K and loai = 'chuoi7' and player_id = $(pid 6)) = 1
   and not exists (select 1 from vkl_sm_thuong where ky_id = $K and loai = 'chuoi7' and player_id = $(pid 8))"
check "Mọi ô về trống, hết bảo hộ" "(select count(*) from vkl_sm_tile where ky_id = $K and (mon_id is not null or bao_ho_toi is not null or chinh_dien)) = 0"
check "Lệnh xuất chinh đang chạy bị hủy (het_ky)" "(select count(*) from vkl_sm_chinh where ky_id = $K and trang_thai in ('tap_hop', 'di')) = 0
   and exists (select 1 from vkl_sm_chinh where mon_id = $C and ket_qua ->> 'ly_do' = 'het_ky')"
check "Trinh sát đang đi được khép lại" "(select count(*) from vkl_sm_trinh where ky_id = $K and ket_qua is null) = 0"
check "Mở khóa thành viên (bot 16)" "(select khoa_toi is null from vkl_sm_member where player_id = $(pid 16))"
check "Tên, huy hiệu, người trong môn giữ nguyên" "vkl_priv.sm_mon_n($A) = $nA and vkl_priv.sm_mon_n($B) = $nB and vkl_priv.sm_mon_n($C) = $nC
   and (select ten = 'Thanh Hư Tông' and huy_hieu = 3 from vkl_sm_mon where id = $A)"
check "Không còn Kỷ đang chạy: vào môn bị chặn" "vkl_priv.sm_ky_now() is null"
expect_err "  ... vkl_sm_join báo SM_KHONG_CO_MON" SM_KHONG_CO_MON "select vkl_sm_join($(tk 16), $B)"
check "Chạy lại job: không làm gì" "vkl_priv.sm_ket_ky_tick() = '[]'::jsonb"
check "Gọi lại sm_ket_ky trên Kỷ đã kết: không phát trùng" "(vkl_priv.sm_ket_ky($K) ->> 'da_ket')::boolean and (select count(*) from vkl_sm_thuong where ky_id = $K and loai = 'hang1') = $nA"
check "RPC vkl_sm_ky_kq() cho Sổ Sinh Tử" "(select (x -> 'mon' -> 0 ->> 'ten') = 'Thanh Hư Tông' and (x -> 'mon' -> 0 ->> 'khac')::boolean from jsonb_array_elements(vkl_sm_ky_kq()) x where (x ->> 'ky')::int = $K)"

# ---------- 17. Kỷ sau: mang môn sang ----------
expect_err "Không mở Kỷ mới khi còn Kỷ chưa kết" SM_KY_CHUA_KET "begin; insert into vkl_sm_ky (bat_dau, ket_thuc, ban_kinh) values (now(), now(), 3); select vkl_priv.sm_ky_moi(now(), now() + interval '1 hour', 6); rollback;"
K2=$(run "select vkl_priv.sm_ky_moi(now() - interval '1 minute', now() + interval '2 hour', 6)")
check "Kỷ mới: A, B, C mang sang, đủ người, chưa ô nào" "(select count(*) from vkl_sm_mon where ky_lap = $K2) = 3 and vkl_priv.sm_mon_n($A) = $nA
  and jsonb_array_length(vkl_sm_list($(tk 1))) = 3 and (select count(*) from vkl_sm_tile where ky_id = $K2 and mon_id is not null) = 0"
expect_ok "Kỷ mới: A cắm cờ lại" "select vkl_sm_pick_tile($(tk 1), 0, 0)"
check "Kỷ mới: cắm cờ đầu không có bảo hộ" "(select bao_ho_toi is null from vkl_sm_tile where ky_id = $K2 and q = 0 and r = 0)"
check "Sổ Sinh Tử vẫn giữ Kỷ cũ" "jsonb_array_length(vkl_sm_ky_kq()) = 1"

# ---------- 18. Quyền ----------
check "anon gọi được vkl_sm_ky_kq" "has_function_privilege('anon', 'public.vkl_sm_ky_kq()', 'execute')"
check "anon KHÔNG gọi được vkl_priv.sm_ket_ky" "not has_function_privilege('anon', 'vkl_priv.sm_ket_ky(int)', 'execute')"
expect_err "Quản trị: người ngoài danh sách bị chặn" SM_QUYEN "select vkl_sm_admin($(tk 2))"
run "insert into vkl_sm_admin_user (username) values ('bot01') on conflict do nothing" >/dev/null
check "Quản trị: người trong danh sách đọc được số môn, người, trận/ngày, cờ" \
  "(select (x -> 'mon' ->> 'dung')::int = 3 and (x ->> 'nguoi')::int > 0 and jsonb_array_length(x -> 'tran_ngay') > 0 and jsonb_array_length(x -> 'co') > 0 from vkl_sm_admin($(tk 1)) x)"
run "delete from vkl_sm_admin_user where username = 'bot01'" >/dev/null

echo
echo "Kết quả bot Sơn Môn: $PASS đạt, $FAIL không đạt"
printf '%s\n' "${RESULTS[@]}"
[ "$FAIL" = 0 ]
