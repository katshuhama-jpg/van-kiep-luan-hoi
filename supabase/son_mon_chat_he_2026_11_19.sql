-- Ngày 8 (lên bản 19/11): tin hệ thống trong Truyền âm (dòng riêng, không tên người gửi).
--   "X vừa khai hoang Y (3/6 ô)", "Z phát lệnh đánh Y, quân tới lúc hh:mm", "Môn ta thắng/thua trận ở Y".
-- Bảng MỚI vkl_sm_chat_he dùng CHUNG dãy số id với vkl_sm_chat để tin người và tin hệ thống xếp đúng thứ tự và con trỏ
-- "sau id" ở trình duyệt vẫn đúng. Hàm đọc MỚI vkl_sm_chat_list2 (không sửa vkl_sm_chat_list cũ).
-- Trigger nuốt lỗi: ghi tin hỏng thì thôi, không bao giờ làm hỏng lệnh khai hoang / xuất chinh / trận.

create table if not exists public.vkl_sm_chat_he (
  id bigint primary key default nextval(pg_get_serial_sequence('public.vkl_sm_chat', 'id')),
  mon_id bigint not null references public.vkl_sm_mon (id) on delete cascade,
  noi_dung text not null,
  noi_dung_en text,
  luc timestamptz not null default now()
);
create index if not exists vkl_sm_chat_he_mon on public.vkl_sm_chat_he (mon_id, id desc);
alter table public.vkl_sm_chat_he enable row level security;

create or replace function vkl_priv.sm_he(p_mon bigint, p_vi text, p_en text)
returns void language sql security definer set search_path = '' as $$
  insert into public.vkl_sm_chat_he (mon_id, noi_dung, noi_dung_en) select p_mon, p_vi, p_en where p_mon is not null;
$$;

create or replace function vkl_priv.sm_he_bao()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_ten_o text := coalesce(new.noi_dung ->> 'ten_o', ''); v_n int; v_max int; v_a text; v_b text; v_kq text;
begin
  begin
    if new.loai = 'cam_co' and coalesce((new.noi_dung ->> 'khai_hoang')::boolean, false) then
      select count(*) into v_n from public.vkl_sm_tile where ky_id = new.ky_id and mon_id = new.mon_a;
      v_max := vkl_priv.sm_o_max(new.mon_a);
      perform vkl_priv.sm_he(new.mon_a,
        format('%s vừa khai hoang %s (%s/%s ô).', coalesce(new.noi_dung ->> 'nguoi', 'Một người'), v_ten_o, v_n, v_max),
        format('%s claimed %s (%s/%s tiles).', coalesce(new.noi_dung ->> 'nguoi', 'Someone'), v_ten_o, v_n, v_max));
    elsif new.loai = 'cam_co' then
      perform vkl_priv.sm_he(new.mon_a, format('Môn ta cắm cờ ở %s.', v_ten_o), format('We planted our flag on %s.', v_ten_o));
    elsif new.loai = 'tran' then
      v_kq := new.noi_dung ->> 'kq';
      select ten into v_a from public.vkl_sm_mon where id = new.mon_a;
      select ten into v_b from public.vkl_sm_mon where id = new.mon_b;
      perform vkl_priv.sm_he(new.mon_a,
        case when v_kq = 'thang' then format('Môn ta thắng trận ở %s, chiếm được ô của %s.', v_ten_o, coalesce(v_b, '?'))
             else format('Môn ta thua trận ở %s. Người đi theo nghỉ 2 giờ.', v_ten_o) end,
        case when v_kq = 'thang' then format('We won at %s and took it from %s.', v_ten_o, coalesce(v_b, '?'))
             else format('We lost at %s. Those who marched rest 2 hours.', v_ten_o) end);
      perform vkl_priv.sm_he(new.mon_b,
        case when v_kq = 'thang' then format('Môn ta thua trận ở %s, %s chiếm mất ô.', v_ten_o, coalesce(v_a, '?'))
             else format('Môn ta giữ được %s trước %s.', v_ten_o, coalesce(v_a, '?')) end,
        case when v_kq = 'thang' then format('We lost %s to %s.', v_ten_o, coalesce(v_a, '?'))
             else format('We held %s against %s.', v_ten_o, coalesce(v_a, '?')) end);
    end if;
  exception when others then null;
  end;
  return new;
end;
$$;

create or replace function vkl_priv.sm_he_chinh()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_ai text; v_ten_o text; v_gio text;
begin
  begin
    select coalesce(nullif(meta -> 'chanThan' ->> 'name', ''), username) into v_ai from public.vkl_players where id = new.nguoi_phat;
    select ten into v_ten_o from public.vkl_sm_tile where ky_id = new.ky_id and q = new.toi_q and r = new.toi_r;
    v_gio := to_char(new.tap_hop_toi at time zone 'Asia/Ho_Chi_Minh', 'HH24:MI');
    perform vkl_priv.sm_he(new.mon_id,
      format('%s phát lệnh đánh %s. Bấm Theo trước %s, hết giờ là lên đường.', coalesce(v_ai, 'Môn chủ'), coalesce(v_ten_o, '?'), v_gio),
      format('%s called a march on %s. Tap Follow before %s; then the army sets out.', coalesce(v_ai, 'The leader'), coalesce(v_ten_o, '?'), v_gio));
  exception when others then null;
  end;
  return new;
end;
$$;

drop trigger if exists vkl_sm_he_bao on public.vkl_sm_bao;
create trigger vkl_sm_he_bao after insert on public.vkl_sm_bao for each row execute function vkl_priv.sm_he_bao();
drop trigger if exists vkl_sm_he_chinh on public.vkl_sm_chinh;
create trigger vkl_sm_he_chinh after insert on public.vkl_sm_chinh for each row execute function vkl_priv.sm_he_chinh();

-- Đọc Truyền âm kèm tin hệ thống (50 dòng cuối). Tin hệ thống: he = true, không tên, không xóa hay báo được.
create or replace function public.vkl_sm_chat_list2(p_token uuid, p_sau bigint default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_me uuid := vkl_priv.sm_me(p_token); v_mon bigint;
begin
  select mon_id into v_mon from public.vkl_sm_member where player_id = v_me;
  if v_mon is null then raise exception 'SM_CHUA_CO_MON'; end if;
  return (select coalesce(jsonb_agg(x.j order by x.id), '[]') from (
    select * from (
      select c.id, vkl_priv.sm_chat_row(c, v_me) j from public.vkl_sm_chat c
       where c.mon_id = v_mon and not c.an and c.id > coalesce(p_sau, 0)
       order by c.id desc limit 50
    ) a
    union all
    select * from (
      select h.id, jsonb_build_object('id', h.id, 'luc', h.luc, 'nd', h.noi_dung, 'nd_en', h.noi_dung_en, 'ta', false, 'tk', '', 'ten', '', 'chuc', null, 'he', true)
        from public.vkl_sm_chat_he h where h.mon_id = v_mon and h.id > coalesce(p_sau, 0)
       order by h.id desc limit 50
    ) b
    order by 1 desc limit 50
  ) x where x.j is not null);
end;
$$;

revoke all on function vkl_priv.sm_he(bigint, text, text) from public;
revoke all on function vkl_priv.sm_he_bao() from public;
revoke all on function vkl_priv.sm_he_chinh() from public;
revoke all on function public.vkl_sm_chat_list2(uuid, bigint) from public;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke all on function vkl_priv.sm_he(bigint, text, text) from anon, authenticated;
    grant execute on function public.vkl_sm_chat_list2(uuid, bigint) to anon, authenticated;
  end if;
end $$;
