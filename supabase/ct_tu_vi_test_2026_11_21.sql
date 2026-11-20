-- Test cho supabase/ct_tu_vi_2026_11_21.sql. Chạy trong transaction rồi ROLLBACK, không để rác:
--   psql ... -f supabase/ct_tu_vi_test_2026_11_21.sql
-- Mọi kiểm tra là ASSERT; sai một cái thì lỗi và dừng. Đúng hết thì in NOTICE 'CT_TV TEST OK'.
-- Trên Supabase thật, vkl_lives có trigger (lives_guard, sm_after_life...): khối test tắt trigger người dùng
-- bằng session_replication_role = replica trong transaction (cần quyền), hoặc chạy trên bản sao.
begin;
set local session_replication_role = replica;
do $$
declare
  t0 timestamptz := '2026-11-21 08:00:00+07';
  p uuid; q uuid; x uuid; tok uuid := gen_random_uuid(); tok_x uuid := gen_random_uuid();
  c record; j jsonb; i int; v_err text;
begin
  insert into public.vkl_players (username, pass_hash, meta) values ('zz_test_ct_tv_p', '-', '{"chanThan":{}}') returning id into p;
  insert into public.vkl_players (username, pass_hash, meta) values ('zz_test_ct_tv_q', '-', '{"chanThan":{}}') returning id into q;
  insert into public.vkl_players (username, pass_hash, meta) values ('zz_test_ct_tv_x', '-', '{}') returning id into x;
  insert into public.vkl_sessions (token, player_id, expires_at) values (tok, p, now() + interval '1 hour'), (tok_x, x, now() + interval '1 hour');
  -- kiếp cũ trước khi có hàng tu vi: không được tính
  insert into public.vkl_lives (player_id, age, realm_no, created_at) values (q, 500, 2, t0 - interval '1 day');

  -- 1. tạo hàng: quà lên Sơ tầng
  select * into c from vkl_priv.ct_tv_chot(p, t0);
  assert c.qua_dau and (c.r).tang = 1 and (c.r).tu_vi = 0 and (c.r).tong_tu_vi = 1000, 'tao hang: qua len So tang';
  -- 2. offline 6 giờ = 600
  select * into c from vkl_priv.ct_tv_chot(p, t0 + interval '6 hours');
  assert c.off_cong = 600 and (c.r).tu_vi = 600 and not c.qua_dau, format('offline 6h: %s', c.off_cong);
  -- 3. offline 18 giờ = 1200 + 6x50 = 1500, tràn qua Trung tầng
  select * into c from vkl_priv.ct_tv_chot(p, t0 + interval '24 hours');
  assert c.off_cong = 1500 and (c.r).tang = 2 and (c.r).tu_vi = 900 and c.tang_len = 1, format('offline 18h: %s tang %s tv %s', c.off_cong, (c.r).tang, (c.r).tu_vi);
  -- 4. offline 40 giờ = dừng ở giờ 24 = 1200 + 600 = 1800; lên Cao tầng, đang tu thanh Viên mãn (1400/1500)
  select * into c from vkl_priv.ct_tv_chot(p, t0 + interval '64 hours');
  assert c.off_cong = 1800 and (c.r).tang = 3 and (c.r).tu_vi = 1400, format('offline 40h: %s tang %s tv %s', c.off_cong, (c.r).tang, (c.r).tu_vi);
  -- 5. thêm 40 giờ: đạt Viên mãn rồi dừng ở bình cảnh 3000 (chỉ cộng 1600 trong 1800)
  select * into c from vkl_priv.ct_tv_chot(p, t0 + interval '104 hours');
  assert c.off_cong = 1600 and (c.r).tang = 4 and (c.r).tu_vi = 3000 and (c.r).tong_tu_vi = 1000 + 600 + 1500 + 1800 + 1600, format('binh canh: %s', c.off_cong);
  select * into c from vkl_priv.ct_tv_chot(p, t0 + interval '110 hours');
  assert c.off_cong = 0 and (c.r).tu_vi = 3000, 'binh canh: dung han';
  -- hàm public đọc được qua token
  j := public.ct_tv_get(tok);
  assert (j ->> 'tang')::int = 4 and (j ->> 'cham_binh_canh')::boolean and (j -> 'dot_pha' ->> 'ti_le')::numeric = 1, format('ct_tv_get: %s', j);

  -- 6. kiếp trong ngày: thứ 1-5 đủ (25 x căn 100 = 250), 6-10 50%, 11 20%; chết trước 16 tuổi = 0 và không đếm
  select * into c from vkl_priv.ct_tv_chot(q, t0);
  assert (c.r).kiep_cuoi > 0 and c.kiep_n = 0, 'kiep cu khong tinh';
  insert into public.vkl_lives (player_id, age, realm_no, created_at) values (q, 10, 1, t0 + interval '1 minute');
  for i in 1..11 loop
    insert into public.vkl_lives (player_id, age, realm_no, created_at) values (q, 100, 2, t0 + make_interval(mins => 1 + i));
  end loop;
  select * into c from vkl_priv.ct_tv_chot(q, t0);
  assert c.kiep_n = 11 and c.kiep_cong = 5 * 250 + 5 * 125 + 50 and (c.r).so_kiep_ngay = 11, format('kiep 1/6/11: n %s cong %s', c.kiep_n, c.kiep_cong);
  -- kiếp thứ 1 của ngày mới (giờ VN) lại tính đủ
  insert into public.vkl_lives (player_id, age, realm_no, created_at) values (q, 100, 2, t0 + interval '17 hours');
  select * into c from vkl_priv.ct_tv_chot(q, t0);
  assert c.kiep_cong = 250 and (c.r).so_kiep_ngay = 1, format('ngay moi: %s', c.kiep_cong);
  -- tốc độ Chuyển 2 = x1,15
  update public.vkl_ct_tu_vi set chuyen = 2, tang = 0, tu_vi = 0 where player_id = q;
  insert into public.vkl_lives (player_id, age, realm_no, created_at) values (q, 100, 2, t0 + interval '18 hours');
  select * into c from vkl_priv.ct_tv_chot(q, t0);
  assert c.kiep_cong = 287.5, format('toc do C2: %s', c.kiep_cong);
  update public.vkl_ct_tu_vi set chuyen = 2, tang = 0, tu_vi = 0, gio_chot = t0 where player_id = q;
  select * into c from vkl_priv.ct_tv_chot(q, t0 + interval '6 hours');
  assert c.off_cong = 690, format('offline C2 6h: %s', c.off_cong);

  -- 7. đột phá ở ngưỡng 100% (C4 -> C5: 85%), trượt 3 lần thì lần thứ 3 chắc chắn
  update public.vkl_ct_tu_vi set chuyen = 4, tang = 4, tu_vi = 8100, so_lan_truot = 0, gio_chot = t0 where player_id = p;
  insert into public.vkl_lives (player_id, age, realm_no, created_at) values (p, 300, 7, t0 - interval '2 days');  -- chìa Độ Kiếp (không cần cho C5)
  update public.vkl_ct_tu_vi set kiep_cuoi = (select max(id) from public.vkl_lives where player_id = p) where player_id = p;
  j := vkl_priv.ct_tv_dot_pha_core(p, t0, 0.90);
  assert not (j ->> 'ok')::boolean and (j ->> 'ti_le')::numeric = 0.85 and (j ->> 'mat')::numeric = 0
     and (j -> 'trang_thai' ->> 'tu_vi')::numeric = 8100, format('100%% truot 1: %s', j);
  j := vkl_priv.ct_tv_dot_pha_core(p, t0, 0.96);
  assert not (j ->> 'ok')::boolean and (j ->> 'ti_le')::numeric = 0.95, format('truot 2 (+10%%): %s', j);
  assert (j -> 'trang_thai' -> 'dot_pha' ->> 'ti_le')::numeric = 1, 'lan thu 3 chac chan';
  j := vkl_priv.ct_tv_dot_pha_core(p, t0, 0.9999);
  assert (j ->> 'ok')::boolean and (j -> 'trang_thai' ->> 'chuyen')::int = 5 and (j -> 'trang_thai' ->> 'tu_vi')::numeric = 0
     and (j -> 'trang_thai' ->> 'so_lan_truot')::int = 0 and (j ->> 'luc_chien_them')::int = 540, format('lan 3 thanh: %s', j);

  -- 8. đột phá ở 150% (C7 -> C8: 75% + 12,5% = 87,5%, căn cơ +10%); trượt mất nửa phần dư
  update public.vkl_ct_tu_vi set chuyen = 7, tang = 4, tu_vi = 66000, so_lan_truot = 0, gio_chot = t0 where player_id = p;
  j := vkl_priv.ct_tv_dot_pha_core(p, t0, 0.90);
  assert not (j ->> 'ok')::boolean and (j ->> 'ti_le')::numeric = 0.875 and (j ->> 'can_co')::numeric = 0.1
     and (j ->> 'mat')::numeric = 11000 and (j -> 'trang_thai' ->> 'tu_vi')::numeric = 55000, format('150%% truot: %s', j);
  update public.vkl_ct_tu_vi set tu_vi = 66000, so_lan_truot = 0 where player_id = p;
  j := vkl_priv.ct_tv_dot_pha_core(p, t0, 0.5);
  assert (j ->> 'ok')::boolean and (j -> 'trang_thai' -> 'can_co' ->> '8')::numeric = 0.1
     and (j ->> 'luc_chien_them')::int = 1122, format('150%% thanh: %s', j);

  -- 9. đột phá ở 200% (bình cảnh): 100%, căn cơ +20%
  update public.vkl_ct_tu_vi set chuyen = 4, tang = 4, tu_vi = 16200, so_lan_truot = 0, gio_chot = t0 where player_id = p;
  j := vkl_priv.ct_tv_dot_pha_core(p, t0, 0.9999);
  assert (j ->> 'ok')::boolean and (j ->> 'ti_le')::numeric = 1 and (j ->> 'can_co')::numeric = 0.2, format('200%%: %s', j);

  -- 10. thiếu chìa Kim Đan (C2 -> C3)
  update public.vkl_ct_tu_vi set chuyen = 2, tang = 4, tu_vi = 2700, so_lan_truot = 0, gio_chot = t0 where player_id = q;
  delete from public.vkl_lives where player_id = q and realm_no >= 3;
  j := vkl_priv.ct_tv_dot_pha_core(q, t0, 0.0);
  assert not (j ->> 'ok')::boolean and j ->> 'chia' = 'kim_dan' and (j -> 'trang_thai' ->> 'chuyen')::int = 2
     and (j -> 'trang_thai' ->> 'tu_vi')::numeric = 2700, format('thieu chia: %s', j);
  insert into public.vkl_lives (player_id, age, realm_no, created_at) values (q, 15, 3, t0);  -- chết trẻ vẫn tính là từng Kim Đan
  j := vkl_priv.ct_tv_dot_pha_core(q, t0, 0.0);
  assert (j ->> 'ok')::boolean and (j -> 'trang_thai' ->> 'chuyen')::int = 3, format('co chia: %s', j);
  -- thiếu chìa Hồng Hoang (C8 -> C9)
  update public.vkl_ct_tu_vi set chuyen = 8, tang = 4, tu_vi = 76000, gio_chot = t0 where player_id = q;
  j := vkl_priv.ct_tv_dot_pha_core(q, t0, 0.0);
  assert j ->> 'chia' = 'hong_hoang', format('thieu chia HH: %s', j);

  -- 11. chưa đủ ngưỡng, Chuyển 9, không có chân thân, sai token
  update public.vkl_ct_tu_vi set chuyen = 3, tang = 3, tu_vi = 100, gio_chot = t0 where player_id = q;
  begin perform vkl_priv.ct_tv_dot_pha_core(q, t0, 0.0); v_err := 'none'; exception when others then v_err := sqlerrm; end;
  assert v_err = 'CT_TV_CHUA_DU', 'chua du: ' || v_err;
  update public.vkl_ct_tu_vi set chuyen = 9, tang = 4, tu_vi = 130000, gio_chot = t0 where player_id = q;
  begin perform vkl_priv.ct_tv_dot_pha_core(q, t0, 0.0); v_err := 'none'; exception when others then v_err := sqlerrm; end;
  assert v_err = 'CT_TV_DINH', 'C9: ' || v_err;
  select * into c from vkl_priv.ct_tv_chot(q, t0 + interval '10 hours');
  assert (c.r).tu_vi = 130000 and c.off_cong = 0, 'C9 dung o nguong';
  begin perform public.ct_tv_get(tok_x); v_err := 'none'; exception when others then v_err := sqlerrm; end;
  assert v_err = 'CT_NO_CT', 'khong chan than: ' || v_err;
  begin perform public.ct_tv_life(gen_random_uuid()); v_err := 'none'; exception when others then v_err := sqlerrm; end;
  assert v_err = 'CT_AUTH', 'sai token: ' || v_err;

  -- 12. Lực chiến: C1 đủ 4 tầng + C2 vào, Sơ tầng = 300 + 400 x 0,7 = 580
  assert vkl_priv.ct_tv_luc_chien(row(p, 2::smallint, 1::smallint, 0, '{}'::jsonb, t0, 0, 0::smallint, null::date, 0, 0, t0, t0)::public.vkl_ct_tu_vi) = 580, 'luc chien';
  raise notice 'CT_TV TEST OK';
end $$;
-- RLS: anon không đọc thẳng bảng được
set local role anon;
do $$ begin
  perform 1 from public.vkl_ct_tu_vi;
  raise exception 'RLS HONG: anon doc duoc bang';
exception when insufficient_privilege then raise notice 'RLS OK: anon khong doc duoc';
end $$;
reset role;
rollback;
