-- Thử kênh Thế giới (the_gioi_chat_2026_11_21.sql). Chạy trong một giao dịch rồi ROLLBACK: không để lại gì.
-- Cách chạy: psql -f supabase/the_gioi_chat_thu_2026_11_21.sql (hoặc dán vào SQL editor). Mỗi dòng kết quả: OK/HỎNG + tên ca.
begin;
create temp table kq (n serial, ok boolean, ca text, chi_tiet text) on commit drop;

create function pg_temp.thu(p_ok boolean, p_ca text, p_ct text default null) returns void language sql as $$
  insert into kq (ok, ca, chi_tiet) values (coalesce(p_ok, false), p_ca, p_ct); $$;
-- gửi, trả 'OK:<nội dung>' hoặc mã lỗi
create function pg_temp.gui(p_tok uuid, p_nd text) returns text language plpgsql as $$
begin return 'OK:' || (public.vkl_wc_send(p_tok, p_nd) ->> 'nd');
exception when others then return sqlerrm; end; $$;
create function pg_temp.bao(p_tok uuid, p_id bigint) returns text language plpgsql as $$
begin return (public.vkl_wc_report(p_tok, p_id))::text;
exception when others then return sqlerrm; end; $$;
-- lùi giờ mọi tin của một người (giả như đã gửi từ trước)
create function pg_temp.lui(p_id uuid, p_s int) returns void language sql as $$
  update public.vkl_wc_chat set luc = luc - make_interval(secs => p_s) where player_id = p_id; $$;

do $$
declare
  a uuid; b uuid; c uuid; d uuid; n uuid; k uuid; t uuid; x uuid; y uuid; z uuid;
  ta uuid; tb uuid; tc uuid; td uuid; tn uuid; tk uuid;
  r text; j jsonb; v_id bigint; v_he int; v_mon bigint; v_ket text; i int;
  ct jsonb := '{"chanThan": {"name": "Thử Nhân"}}';
begin
  -- tài khoản thử: đủ điều kiện (a, b, c, d), chưa liên kết Google (n), chưa có chân thân (k)
  insert into public.vkl_players (username, meta, google_sub) values ('test_wc_a', '{"chanThan": {"name": "Lý Thanh Vân"}}', 'gg_a') returning id into a;
  insert into public.vkl_players (username, meta, google_sub) values ('test_wc_b', ct, 'gg_b') returning id into b;
  insert into public.vkl_players (username, meta, google_sub) values ('test_wc_c', ct, 'gg_c') returning id into c;
  insert into public.vkl_players (username, meta, google_sub) values ('test_wc_d', ct, 'gg_d') returning id into d;
  insert into public.vkl_players (username, meta, google_sub) values ('test_wc_n', ct, null) returning id into n;
  insert into public.vkl_players (username, meta, google_sub) values ('test_wc_k', '{}', 'gg_k') returning id into k;
  insert into public.vkl_sessions (token, player_id, expires_at) values (gen_random_uuid(), a, now() + interval '1 day') returning token into ta;
  insert into public.vkl_sessions (token, player_id, expires_at) values (gen_random_uuid(), b, now() + interval '1 day') returning token into tb;
  insert into public.vkl_sessions (token, player_id, expires_at) values (gen_random_uuid(), c, now() + interval '1 day') returning token into tc;
  insert into public.vkl_sessions (token, player_id, expires_at) values (gen_random_uuid(), d, now() + interval '1 day') returning token into td;
  insert into public.vkl_sessions (token, player_id, expires_at) values (gen_random_uuid(), n, now() + interval '1 day') returning token into tn;
  insert into public.vkl_sessions (token, player_id, expires_at) values (gen_random_uuid(), k, now() + interval '1 day') returning token into tk;
  insert into public.vkl_lives (player_id, player_name, char_name, realm_no, layer_no, path, ascended, look, created_at)
    values (a, 'test_wc_a', 'A1', 9, 2, 'kiem', true, '{"cosmos": "tien"}', now() - interval '2 days'), (a, 'test_wc_a', 'A2', 3, 1, 'dan', false, '{}', now() - interval '1 day');

  -- 1. gửi hợp lệ
  j := public.vkl_wc_send(ta, '  Chào   đạo hữu!  ');
  perform pg_temp.thu(j ->> 'nd' = 'Chào đạo hữu!' and (j ->> 'ta')::boolean and j ->> 'ten' = 'Lý Thanh Vân' and (j ->> 'rn')::int = 9
    and j ->> 'co' = 'tien' and j ->> 'p' = 'dan' and not (j ? 'player_id') and not (j ? 'tk'), 'gửi hợp lệ, kèm tên chân thân/cảnh giới cao nhất/con đường kiếp gần nhất, không lộ id', j::text);

  -- 2. quá nhanh (dưới 10 giây)
  r := pg_temp.gui(ta, 'tin thứ hai ngay sau');
  perform pg_temp.thu(r = 'WC_NHANH', 'quá nhanh dưới 10 giây bị chặn', r);
  perform pg_temp.lui(a, 9);
  r := pg_temp.gui(ta, 'mới 9 giây');
  perform pg_temp.thu(r = 'WC_NHANH', '9 giây vẫn chặn', r);
  perform pg_temp.lui(a, 2);
  r := pg_temp.gui(ta, 'đã 11 giây');
  perform pg_temp.thu(r like 'OK:%', '11 giây thì gửi được', r);

  -- 3. đúng 512 ký tự / 513 ký tự
  perform pg_temp.lui(a, 11);
  r := pg_temp.gui(ta, repeat('a', 512));
  perform pg_temp.thu(r = 'OK:' || repeat('a', 512), 'đúng 512 ký tự gửi được', left(r, 20));
  perform pg_temp.lui(a, 11);
  r := pg_temp.gui(ta, repeat('b', 513));
  perform pg_temp.thu(r = 'WC_DAI', '513 ký tự bị chặn', r);
  r := pg_temp.gui(ta, repeat('ệ', 512));
  perform pg_temp.thu(r like 'OK:%', '512 ký tự có dấu (đếm ký tự, không đếm byte)', left(r, 10));

  -- 4. trùng y hệt tin trước của mình trong 2 phút
  perform pg_temp.lui(a, 11);
  r := pg_temp.gui(ta, 'Có ai vừa phi thăng không?');
  perform pg_temp.lui(a, 11);
  r := pg_temp.gui(ta, 'Có ai vừa phi thăng không?');
  perform pg_temp.thu(r = 'WC_TRUNG', 'tin trùng trong 2 phút bị chặn', r);
  perform pg_temp.lui(a, 110);
  r := pg_temp.gui(ta, 'Có ai vừa phi thăng không?');
  perform pg_temp.thu(r like 'OK:%', 'tin trùng sau 2 phút thì gửi được', r);

  -- 5. link, số điện thoại, từ tục, xuống dòng
  perform pg_temp.lui(a, 130);
  r := pg_temp.gui(ta, 'vào https://lua-dao.example/abc mà nhận quà, hoặc shopquatang.vn nhé');
  perform pg_temp.thu(r = 'OK:vào [link ẩn] mà nhận quà, hoặc [link ẩn] nhé', 'link bị ẩn', r);
  perform pg_temp.lui(a, 11);
  r := pg_temp.gui(ta, 'gọi 0912 345 678 hoặc +84912345678');
  perform pg_temp.thu(r = 'OK:gọi [số ẩn] hoặc [số ẩn]', 'số điện thoại bị ẩn', r);
  perform pg_temp.lui(a, 11);
  r := pg_temp.gui(ta, 'ĐM thằng chó này');
  perform pg_temp.thu(r = 'OK:** ********* này', 'từ tục bị che', r);
  perform pg_temp.lui(a, 11);
  r := pg_temp.gui(ta, E'dòng một\n\n\n\ndòng hai  \n  đm');
  perform pg_temp.thu(r = E'OK:dòng một\n\ndòng hai\n**', 'giữ xuống dòng (tối đa 1 dòng trống), che từ tục từng dòng', r);
  perform pg_temp.lui(a, 11);
  r := pg_temp.gui(ta, E'   \n  ');
  perform pg_temp.thu(r = 'WC_TRONG', 'tin trống bị chặn', r);

  -- 6. tin thứ 21 trong 5 phút (b: 19 tin cũ rải trong 4 phút, cách nhau > 10 giây)
  insert into public.vkl_wc_chat (player_id, noi_dung, luc) select b, 'cũ ' || g, now() - make_interval(secs => 20 + g * 12) from generate_series(1, 19) g;
  r := pg_temp.gui(tb, 'tin thứ 20');
  perform pg_temp.thu(r like 'OK:%', 'tin thứ 20 trong 5 phút gửi được', r);
  perform pg_temp.lui(b, 11);
  r := pg_temp.gui(tb, 'tin thứ 21');
  perform pg_temp.thu(r = 'WC_NHIEU', 'tin thứ 21 trong 5 phút bị chặn', r);

  -- 7. chưa liên kết / chưa chân thân / chưa đăng nhập: không gửi được nhưng vẫn đọc được
  r := pg_temp.gui(tn, 'xin chào');
  perform pg_temp.thu(r = 'WC_NO_GG', 'chưa liên kết Google bị chặn', r);
  r := pg_temp.gui(tk, 'xin chào');
  perform pg_temp.thu(r = 'WC_NO_CT', 'chưa có chân thân bị chặn', r);
  j := public.vkl_wc_list(tn, 0);
  perform pg_temp.thu(not (j ->> 'gui')::boolean and j ->> 'ly' = 'WC_NO_GG' and jsonb_array_length(j -> 'tin') > 0, 'chưa liên kết vẫn đọc được, có lý do', j ->> 'ly');
  j := public.vkl_wc_list(tk, 0);
  perform pg_temp.thu(j ->> 'ly' = 'WC_NO_CT', 'chưa chân thân: lý do WC_NO_CT', j ->> 'ly');
  r := pg_temp.gui(gen_random_uuid(), 'xin chào');
  perform pg_temp.thu(r = 'WC_AUTH', 'token lạ bị chặn', r);
  r := pg_temp.bao(tn, (select max(id) from public.vkl_wc_chat where player_id = a));
  perform pg_temp.thu(r = 'WC_NO_GG', 'chưa liên kết không báo xấu được', r);

  -- 8. bị cấm
  insert into public.vkl_wc_cam (player_id, toi, ly_do) values (c, now() + interval '1 hour', 'thu');
  r := pg_temp.gui(tc, 'xin chào');
  perform pg_temp.thu(r = 'WC_CAM', 'đang bị cấm thì không gửi được', r);
  j := public.vkl_wc_list(tc, 0);
  perform pg_temp.thu(j ->> 'ly' = 'WC_CAM' and j ? 'toi', 'list báo đang bị cấm kèm giờ hết cấm', j::text);
  update public.vkl_wc_cam set toi = now() - interval '1 second' where player_id = c;
  r := pg_temp.gui(tc, 'hết cấm rồi');
  perform pg_temp.thu(r like 'OK:%', 'hết hạn cấm thì gửi lại được', r);

  -- 9. 3 báo xấu thì tin tự ẩn
  v_id := (select max(id) from public.vkl_wc_chat where player_id = a);
  r := pg_temp.bao(ta, v_id);
  perform pg_temp.thu(r = 'WC_QUYEN', 'không tự báo tin mình', r);
  j := public.vkl_wc_report(tb, v_id);
  perform pg_temp.thu((j ->> 'so_bao')::int = 1 and not (j ->> 'an')::boolean, '1 báo: chưa ẩn', j::text);
  j := public.vkl_wc_report(tb, v_id);
  perform pg_temp.thu((j ->> 'so_bao')::int = 1, 'một người báo hai lần chỉ tính một', j::text);
  j := public.vkl_wc_report(tc, v_id);
  perform pg_temp.thu((j ->> 'so_bao')::int = 2 and not (j ->> 'an')::boolean, '2 báo: chưa ẩn', j::text);
  j := public.vkl_wc_report(td, v_id);
  perform pg_temp.thu((j ->> 'so_bao')::int = 3 and (j ->> 'an')::boolean and not (j ->> 'cam')::boolean, '3 báo: tin tự ẩn, chưa cấm', j::text);
  perform pg_temp.thu(not exists (select 1 from jsonb_array_elements(public.vkl_wc_list(tb, 0) -> 'tin') e where (e ->> 'id')::bigint = v_id), 'tin đã ẩn không còn trong danh sách');

  -- 10. bị ẩn từ 3 tin trong 24 giờ thì tự cấm 24 giờ
  for i in 1 .. 2 loop
    v_id := (select id from public.vkl_wc_chat where player_id = a and not an order by id desc limit 1);
    perform public.vkl_wc_report(tb, v_id); perform public.vkl_wc_report(tc, v_id); j := public.vkl_wc_report(td, v_id);
  end loop;
  perform pg_temp.thu((j ->> 'cam')::boolean and exists (select 1 from public.vkl_wc_cam where player_id = a and toi > now() + interval '23 hours'), 'ẩn 3 tin trong 24 giờ: tự cấm 24 giờ', j::text);
  perform pg_temp.lui(a, 30);
  r := pg_temp.gui(ta, 'còn nói được không');
  perform pg_temp.thu(r = 'WC_CAM', 'bị tự cấm thì không gửi được', r);

  -- 11. đếm tin mới (chấm đỏ) và đọc tiếp sau id
  v_id := (select max(id) from public.vkl_wc_chat);
  perform pg_temp.lui(b, 300);
  perform public.vkl_wc_send(tb, 'tin mới cho chấm đỏ');
  perform pg_temp.thu(public.vkl_wc_n(tc, v_id) = 1 and public.vkl_wc_n(tb, v_id) = 0, 'vkl_wc_n đếm tin người khác, không đếm tin mình');
  j := public.vkl_wc_list(tc, v_id);
  perform pg_temp.thu(jsonb_array_length(j -> 'tin') = 1 and not ((j -> 'tin' -> 0 ->> 'ta')::boolean), 'list sau id chỉ trả tin mới', j::text);
  perform pg_temp.thu(jsonb_array_length(public.vkl_wc_list(tc, 0) -> 'tin') <= 50, 'list tối đa 50 tin');

  -- 12. tin hệ thống: phi thăng lần đầu, Khai Thiên lần đầu, kết cục chưa ai mở, môn chiếm Linh Mạch / Thiên Trì
  delete from public.vkl_wc_cho;
  update public.vkl_wc_chat set luc = luc - interval '10 minutes' where loai = 'he';
  insert into public.vkl_players (username, meta) values ('wcthu_x', '{"chanThan": {"name": "Hàn Lập"}}') returning id into x;
  insert into public.vkl_players (username, meta) values ('wcthu_y', '{"chanThan": {"name": "Bạch Tố"}}') returning id into y;
  insert into public.vkl_players (username, meta) values ('wcthu_z', '{}') returning id into z;
  insert into public.vkl_players (username, meta) values ('test_wc_t', ct) returning id into t;
  insert into public.vkl_saves (player_id, state) values (x, '{"char": {"name": "X", "realm": 7, "ascended": false}}'),
    (y, '{"char": {"name": "Y", "realm": 7}}'), (z, '{"char": {"name": "Tiêu Viêm", "realm": 14, "cosmos": "hg"}}'), (t, '{"char": {"realm": 7}}');
  update public.vkl_saves set state = '{"char": {"name": "X", "realm": 8, "ascended": true, "cosmos": "tien"}}' where player_id = x;
  perform pg_temp.thu((select count(*) from public.vkl_wc_chat where loai = 'he' and luc > now() - interval '3 minutes') = 1
    and (select noi_dung from public.vkl_wc_chat where loai = 'he' order by id desc limit 1) = 'Hàn Lập vừa phi thăng lần đầu.',
    'phi thăng lần đầu: đăng ngay khi 3 phút qua chưa có tin hệ thống', (select noi_dung || ' / ' || noi_dung_en from public.vkl_wc_chat where loai = 'he' order by id desc limit 1));
  update public.vkl_saves set state = '{"char": {"name": "Y", "realm": 8, "ascended": true}}' where player_id = y;
  update public.vkl_saves set state = '{"char": {"name": "Tiêu Viêm", "realm": 15, "cosmos": "hg"}}' where player_id = z;
  update public.vkl_saves set state = '{"char": {"realm": 15, "ascended": true}}' where player_id = t;
  perform pg_temp.thu((select count(*) from public.vkl_wc_chat where loai = 'he' and luc > now() - interval '3 minutes') = 1
    and (select count(*) from public.vkl_wc_cho) = 2, 'trong 3 phút: chỉ vào hàng chờ, không đăng thêm; tài khoản thử bị bỏ qua', (select string_agg(loai || ':' || ten, ', ') from public.vkl_wc_cho));
  -- phi thăng lại (kiếp sau) thì không báo nữa
  update public.vkl_saves set state = '{"char": {"name": "X2", "realm": 1}}' where player_id = x;
  update public.vkl_saves set state = '{"char": {"name": "X2", "realm": 8, "ascended": true}}' where player_id = x;
  perform pg_temp.thu((select count(*) from public.vkl_wc_cho where ten = 'Hàn Lập') = 0, 'phi thăng lần hai không báo lại');
  -- lưu game hỏng kiểu dữ liệu vẫn lưu được
  update public.vkl_saves set state = '{"char": {"realm": {"x": 1}, "ascended": [1]}}' where player_id = y;
  perform pg_temp.thu((select state -> 'char' -> 'realm' from public.vkl_saves where player_id = y) = '{"x": 1}', 'dữ liệu lưu lạ: trigger không làm hỏng lưu game');
  -- kết cục chưa ai mở (mã có trong danh sách trắng), mã lạ thì bỏ qua
  select id into v_ket from public.vkl_wc_ket where lan_dau is null order by id limit 1;
  if v_ket is null then insert into public.vkl_wc_ket (id) values ('thu_ket_moi') returning id into v_ket; end if;
  insert into public.vkl_lives (player_id, player_name, char_name, realm_no, path, look) values (y, 'wcthu_y', 'Y', 3, 'kiem', jsonb_build_object('ending', 'ma_khong_co_that'));
  perform pg_temp.thu((select count(*) from public.vkl_wc_cho where loai = 'ket') = 0, 'kết cục mã lạ (client tự bịa) bị bỏ qua');
  insert into public.vkl_lives (player_id, player_name, char_name, realm_no, path, look) values (y, 'wcthu_y', 'Y', 3, 'kiem', jsonb_build_object('ending', v_ket));
  insert into public.vkl_lives (player_id, player_name, char_name, realm_no, path, look) values (x, 'wcthu_x', 'X', 3, 'kiem', jsonb_build_object('ending', v_ket));
  perform pg_temp.thu((select count(*) from public.vkl_wc_cho where loai = 'ket') = 1, 'kết cục lần đầu trên máy chủ: chỉ người đầu tiên', v_ket);
  -- Sơn Môn: cắm cờ Linh Mạch, thắng trận ở Thiên Trì; thua trận và yêu thú thì không
  insert into public.vkl_sm_mon (ten) values ('Thử Kiếm Tông') returning id into v_mon;
  insert into public.vkl_sm_dat (ky_id, q, r, loai, ten_rieng) values (-77, 1, 1, 'linh_mach', 'Thanh Ngọc Mạch'), (-77, 0, 0, 'thien_tri', 'Thiên Trì');
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, q, r, noi_dung) values (-77, 'cam_co', v_mon, 1, 1, '{"ten_o": "Lạc Hà Cốc"}');
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung) values (-77, 'tran', v_mon, null, 0, 0, '{"ten_o": "Thiên Trì", "kq": "thua"}');
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung) values (-77, 'tran', vkl_priv.sm_yeu_mon(), v_mon, 0, 0, '{"ten_o": "Thiên Trì", "kq": "thang"}');
  insert into public.vkl_sm_bao (ky_id, loai, mon_a, mon_b, q, r, noi_dung) values (-77, 'tran', v_mon, null, 0, 0, '{"ten_o": "Thiên Trì", "kq": "thang"}');
  perform pg_temp.thu((select count(*) from public.vkl_wc_cho where loai = 'mon') = 2, 'môn chiếm Linh Mạch / Thiên Trì vào hàng chờ (thua trận, yêu thú thì không)', (select string_agg(w.x, ', ') from public.vkl_wc_cho w where loai = 'mon'));
  -- 3 phút sau: gom thành MỘT tin
  perform pg_temp.thu(vkl_priv.wc_he_xa() = 0, 'chưa đủ 3 phút thì chưa xả hàng chờ');
  update public.vkl_wc_chat set luc = luc - interval '181 seconds' where loai = 'he';
  v_he := (select count(*) from public.vkl_wc_chat where loai = 'he');
  i := vkl_priv.wc_he_xa(); -- gọi riêng: câu lệnh khác mới thấy dòng hàm vừa ghi
  perform pg_temp.thu(i = 1 and (select count(*) from public.vkl_wc_chat where loai = 'he') = v_he + 1 and not exists (select 1 from public.vkl_wc_cho),
    'qua 3 phút: gom hàng chờ thành 1 tin', (select noi_dung || ' / ' || noi_dung_en from public.vkl_wc_chat where loai = 'he' order by id desc limit 1));
  perform pg_temp.thu(vkl_priv.wc_he_xa() = 0, 'hàng chờ trống thì không đăng gì');
  j := public.vkl_wc_list(tn, 0) -> 'tin';
  perform pg_temp.thu(exists (select 1 from jsonb_array_elements(j) e where (e ->> 'he')::boolean and e ? 'nd_en'), 'list trả tin hệ thống kèm bản tiếng Anh');
  perform pg_temp.thu(vkl_priv.wc_ds(array['A', 'B', 'C', 'D', 'E'], false) = 'A, B, C và 2 người nữa' and vkl_priv.wc_ds(array['A', 'B'], true) = 'A and B', 'ghép tên khi dồn nhiều người');
  r := pg_temp.bao(tb, (select max(id) from public.vkl_wc_chat where loai = 'he'));
  perform pg_temp.thu(r = 'WC_QUYEN', 'không báo xấu tin hệ thống', r);

  -- 13. dọn tin quá 7 ngày
  insert into public.vkl_wc_chat (player_id, noi_dung, luc) values (b, 'tin cũ 8 ngày', now() - interval '8 days') returning id into v_id;
  insert into public.vkl_wc_bao (chat_id, player_id) values (v_id, c);
  j := vkl_priv.wc_don();
  perform pg_temp.thu(not exists (select 1 from public.vkl_wc_chat where id = v_id) and not exists (select 1 from public.vkl_wc_bao where chat_id = v_id)
    and exists (select 1 from public.vkl_wc_chat where player_id = b and luc > now() - interval '7 days'), 'dọn: xóa tin quá 7 ngày (kèm báo xấu), giữ tin mới', j::text);
  perform pg_temp.thu(exists (select 1 from cron.job where jobname = 'vkl_wc_don' and schedule = '30 20 * * *'), 'cron dọn lúc 20:30 UTC = 3:30 giờ VN');

  -- 14. quyền: trình duyệt (anon) không gọi được hàm nội bộ, không đọc được bảng
  perform pg_temp.thu(not has_function_privilege('anon', 'vkl_priv.wc_he_xa()', 'execute') and has_function_privilege('anon', 'public.vkl_wc_send(uuid, text)', 'execute')
    and (select relrowsecurity from pg_class where oid = 'public.vkl_wc_chat'::regclass), 'quyền: anon chỉ gọi hàm public, bảng bật RLS');
end $$;

select case when ok then 'OK  ' else 'HỎNG' end || ' ' || ca || coalesce('  [' || left(chi_tiet, 160) || ']', '') as ket_qua from kq order by n;
select count(*) filter (where ok) || '/' || count(*) || ' OK' as tong from kq;
rollback;
