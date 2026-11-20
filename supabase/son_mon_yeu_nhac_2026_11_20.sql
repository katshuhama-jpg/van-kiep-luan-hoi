-- 20/11 12h (Tyler): đợt yêu thú đầu (12:00) không ai sang giữ ô vì người chơi không để ý dấu ! trên bản đồ.
--  * sm_yeu_nhac (cron 5 phút): báo vào kênh chat của môn bị nhắm lúc yêu thú báo (trước 1 giờ) và khi còn 30 phút.
--  * vkl_sm_canh(token): các đòn sắp đánh vào môn của người chơi (yêu thú và môn khác), để thanh tab hiện dải cảnh báo ở mọi trang.

alter table public.vkl_sm_yeu_cong add column if not exists nhac_1 timestamptz, add column if not exists nhac_30 timestamptz;

create or replace function vkl_priv.sm_yeu_nhac()
returns int language plpgsql security definer set search_path = '' as $$
declare x record; v_n int := 0; v_gio text; v_luc text; v_lc text;
begin
  for x in
    select y.*, t.ten ten_o, s.ten ten_tu, g.n, g.lc
      from public.vkl_sm_yeu_cong y
      join public.vkl_sm_tile t on t.ky_id = y.ky_id and t.q = y.q and t.r = y.r
      left join public.vkl_sm_tile s on s.ky_id = y.ky_id and s.q = y.tu_q and s.r = y.tu_r
      left join lateral vkl_priv.sm_giu(y.ky_id, y.mon_id, y.q, y.r) g on true
     where y.trang_thai = 'cho' and y.toi_luc > now()
       and (y.nhac_1 is null or (y.nhac_30 is null and y.toi_luc <= now() + interval '31 minutes'))
     order by y.id
  loop
    v_gio := to_char(x.toi_luc at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI');
    v_luc := to_char(x.luc, 'FM999G999');
    v_lc := to_char(round(coalesce(x.lc, 0)), 'FM999G999');
    if x.nhac_1 is null then
      insert into public.vkl_sm_chat_he (mon_id, noi_dung, noi_dung_en) values (x.mon_id,
        (case when x.trieu then 'Thú triều: ' else '' end) || 'Yêu thú sắp đánh ' || x.ten_o || ' lúc ' || v_gio || ', lực ' || replace(v_luc, ',', '.') ||
        '. Sang đứng giữ ô đó: sức giữ lớn hơn thì đẩy lui được, mỗi người giữ +5 phúc duyên. Hoặc phát lệnh diệt ổ yêu ở ' || coalesce(x.ten_tu, 'gần đó') ||
        ' trước giờ đánh, đệ tử cũng phát lệnh được.',
        (case when x.trieu then 'Beast tide: ' else '' end) || 'Beasts will raid ' || x.ten_o || ' at ' || v_gio || ', power ' || v_luc ||
        '. Guard that tile: out-defend them and each guard gets +5 blessing. Or march on the den at ' || coalesce(x.ten_tu, 'nearby') ||
        ' before then; disciples can order it too.');
      update public.vkl_sm_yeu_cong set nhac_1 = now(), nhac_30 = case when toi_luc <= now() + interval '31 minutes' then now() end where id = x.id;
    else
      insert into public.vkl_sm_chat_he (mon_id, noi_dung, noi_dung_en) values (x.mon_id,
        'Còn 30 phút yêu thú tới ' || x.ten_o || ' (' || v_gio || '). Đang có ' || coalesce(x.n, 0) || ' người đứng giữ, sức giữ chưa tính sân nhà khoảng ' ||
        replace(v_lc, ',', '.') || ', lực yêu thú ' || replace(v_luc, ',', '.') || '.',
        '30 minutes until the beasts reach ' || x.ten_o || ' (' || v_gio || '). ' || coalesce(x.n, 0) || ' guards there, about ' ||
        v_lc || ' defence before home bonus, beast power ' || v_luc || '.');
      update public.vkl_sm_yeu_cong set nhac_30 = now() where id = x.id;
    end if;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;
revoke all on function vkl_priv.sm_yeu_nhac() from public;

create or replace function public.vkl_sm_canh(p_token uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon bigint;
begin
  select mon_id into v_mon from public.vkl_sm_member where player_id = v_me;
  if v_mon is null then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(x order by x ->> 'toi') from (
      select jsonb_build_object('k', 'yeu', 'id', y.id, 'o', t.ten, 'toi', y.toi_luc, 'luc', y.luc, 'trieu', y.trieu) x
        from public.vkl_sm_yeu_cong y join public.vkl_sm_tile t on t.ky_id = y.ky_id and t.q = y.q and t.r = y.r
       where y.mon_id = v_mon and y.trang_thai = 'cho' and y.toi_luc > now()
      union all
      select jsonb_build_object('k', 'mon', 'id', c.id, 'o', t.ten, 'toi', c.toi_noi_luc, 'tu', m.ten)
        from public.vkl_sm_chinh c
        join public.vkl_sm_tile t on t.ky_id = c.ky_id and t.q = c.toi_q and t.r = c.toi_r and t.mon_id = v_mon
        join public.vkl_sm_mon m on m.id = c.mon_id
       where c.trang_thai in ('tap_hop', 'di') and c.mon_id <> v_mon and c.toi_noi_luc > now()
    ) z), '[]'::jsonb);
end;
$$;
revoke all on function public.vkl_sm_canh(uuid) from public;
grant execute on function public.vkl_sm_canh(uuid) to anon, authenticated;

select cron.schedule('vkl_sm_yeu_nhac', '1-56/5 * * * *', 'select vkl_priv.sm_yeu_nhac()');
