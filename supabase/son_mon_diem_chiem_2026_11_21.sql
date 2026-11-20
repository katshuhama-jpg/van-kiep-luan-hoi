-- 20/11 23:49 (Tyler: "chiếm ô thắng cũng có thưởng ngay", lên 5:00 21/11):
-- Mỗi trận xuất chinh THẮNG mà lấy được ô từ môn khác hoặc từ yêu thú: môn đánh +2 Điểm giữ đất ngay lúc tính trận.
-- Không tính khai hoang ô trống (tránh Bỏ ô rồi khai hoang lại để cày điểm). Trần 10 điểm mỗi môn mỗi ngày (5 trận thắng).
-- Thù 12 giờ giữ nguyên nên hai môn không đổi ô qua lại liên tục được.
-- Chỉ thêm bảng, hàm, trigger MỚI; không sửa hàm cũ. Bắt đầu tính từ 5:00 21/11 (cfg diem_chiem.bat_dau).

insert into public.vkl_sm_cfg (k, v) values ('diem_chiem', jsonb_build_object('bat_dau', '2026-11-20T22:00:00Z', 'diem', 2, 'tran_ngay', 10))
on conflict (k) do nothing;

create table if not exists public.vkl_sm_diem_chiem (
  chinh_id bigint primary key references public.vkl_sm_chinh (id) on delete cascade,
  ky_id int not null,
  mon_id bigint not null,
  ngay date not null,
  diem numeric not null,
  luc timestamptz not null default now()
);
create index if not exists vkl_sm_diem_chiem_mon on public.vkl_sm_diem_chiem (mon_id, ngay);
alter table public.vkl_sm_diem_chiem enable row level security;

create or replace function vkl_priv.sm_diem_chiem_trg()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c jsonb; v_ngay date; v_da numeric; v_them numeric;
begin
  if new.trang_thai is distinct from 'xong' or new.ket_qua ->> 'kq' is distinct from 'thang' then return new; end if;
  if not (new.ket_qua ->> 'mon_b' is not null or coalesce((new.ket_qua ->> 'yeu')::boolean, false)) then return new; end if;
  select v into c from public.vkl_sm_cfg where k = 'diem_chiem';
  if c is null or now() < (c ->> 'bat_dau')::timestamptz then return new; end if;
  v_ngay := vkl_priv.sm_day(coalesce(new.toi_noi_luc, now()));
  if exists (select 1 from public.vkl_sm_diem_chiem where chinh_id = new.id) then return new; end if;
  select coalesce(sum(diem), 0) into v_da from public.vkl_sm_diem_chiem where mon_id = new.mon_id and ngay = v_ngay;
  v_them := least((c ->> 'diem')::numeric, greatest((c ->> 'tran_ngay')::numeric - v_da, 0));
  insert into public.vkl_sm_diem_chiem (chinh_id, ky_id, mon_id, ngay, diem) values (new.id, new.ky_id, new.mon_id, v_ngay, v_them)
  on conflict (chinh_id) do nothing;
  if v_them > 0 then
    insert into public.vkl_sm_diem (ky_id, mon_id, diem, cap_nhat) values (new.ky_id, new.mon_id, v_them, now())
    on conflict (ky_id, mon_id) do update set diem = public.vkl_sm_diem.diem + excluded.diem, cap_nhat = now();
  end if;
  return new;
end;
$$;

drop trigger if exists vkl_sm_diem_chiem on public.vkl_sm_chinh;
create trigger vkl_sm_diem_chiem after insert or update of trang_thai, ket_qua on public.vkl_sm_chinh
  for each row execute function vkl_priv.sm_diem_chiem_trg();
