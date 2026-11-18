-- 18/11 (Tyler): ô cắm cờ bảo hộ 48 giờ; các ô chiếm sau bảo hộ ngắn dần theo thứ tự mở, chia đôi mỗi ô, tính từ lúc
-- chiếm ô đó và không quá mốc 48 giờ của môn: ô 2: 24 giờ, ô 3: 12 giờ, ô 4: 6 giờ, từ ô 5: không bảo hộ môn mới.
-- Thứ tự = số ô môn đang giữ cộng một (mất ô rồi chiếm lại thì tính theo số ô lúc chiếm).
-- Thay trigger của son_mon_bao_ho_moi_2026_11_18. Chạy lại nhiều lần không hỏng.

-- ô vừa về tay một môn đang được bảo hộ: bảo hộ theo thứ tự
create or replace function vkl_priv.sm_tile_bh()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v timestamptz; v_k int; v_gio numeric; v_bh timestamptz;
begin
  if new.mon_id is not null and (tg_op = 'INSERT' or new.mon_id is distinct from old.mon_id) then
    select moi_bh_toi into v from public.vkl_sm_mon where id = new.mon_id;
    if v is not null and v > now() then
      select count(*) + 1 into v_k from public.vkl_sm_tile
       where mon_id = new.mon_id and ky_id = new.ky_id and not (q = new.q and r = new.r);
      v_gio := coalesce(vkl_priv.sm_cfg('gio', 'moi_gio'), 48) / power(2, v_k - 1);
      if v_k = 1 then v_bh := v;
      elsif v_k <= 4 then v_bh := least(v, now() + make_interval(mins => round(v_gio * 60)::int));
      end if;
      if v_bh is not null and (new.bao_ho_toi is null or new.bao_ho_toi < v_bh) then
        new.bao_ho_toi := v_bh;
      end if;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists vkl_sm_tile_bh on public.vkl_sm_tile;
create trigger vkl_sm_tile_bh before insert or update of mon_id on public.vkl_sm_tile
  for each row execute function vkl_priv.sm_tile_bh();

-- mốc môn đổi: lúc đặt mốc chỉ nâng ô đầu tiên (ô cắm cờ); mất bảo hộ thì bỏ bảo hộ môn mới trên mọi ô
create or replace function vkl_priv.sm_mon_bh_o()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.moi_bh_toi is distinct from old.moi_bh_toi then
    if old.moi_bh_toi is not null and (new.moi_bh_toi is null or new.moi_bh_toi < old.moi_bh_toi) then
      -- bỏ mọi bảo hộ còn dài hơn 6 giờ thường kể từ lúc chiếm (tức bảo hộ do luật môn mới)
      update public.vkl_sm_tile set bao_ho_toi = null
       where mon_id = new.id and bao_ho_toi > now()
         and bao_ho_toi > coalesce(chiem_luc, now()) + make_interval(hours => coalesce(vkl_priv.sm_cfg('gio', 'bao_ho_gio'), 6)::int);
    end if;
    if new.moi_bh_toi is not null and new.moi_bh_toi > now() and old.moi_bh_toi is null then
      update public.vkl_sm_tile set bao_ho_toi = new.moi_bh_toi
       where mon_id = new.id and (bao_ho_toi is null or bao_ho_toi < new.moi_bh_toi)
         and (q, r) = (select t.q, t.r from public.vkl_sm_tile t where t.mon_id = new.id order by t.chiem_luc nulls first limit 1);
    end if;
  end if;
  return null;
end;
$$;

-- tính lại các ô đã chiếm trước khi đổi luật: theo thứ tự chiếm của từng môn đang bảo hộ
with x as (
  select t.ky_id, t.q, t.r, m.moi_bh_toi, t.chiem_luc,
         row_number() over (partition by t.mon_id order by t.chiem_luc nulls first) k
    from public.vkl_sm_tile t join public.vkl_sm_mon m on m.id = t.mon_id
   where m.moi_bh_toi > now()
)
update public.vkl_sm_tile t
   set bao_ho_toi = case
     when x.k = 1 then x.moi_bh_toi
     when x.k <= 4 then least(x.moi_bh_toi, coalesce(x.chiem_luc, now()) + make_interval(mins => round(coalesce(vkl_priv.sm_cfg('gio', 'moi_gio'), 48) / power(2, x.k - 1) * 60)::int))
     else null end
  from x
 where t.ky_id = x.ky_id and t.q = x.q and t.r = x.r;

select t.mon_id, t.q, t.r, t.chiem_luc at time zone 'Asia/Ho_Chi_Minh' as chiem_luc, t.bao_ho_toi at time zone 'Asia/Ho_Chi_Minh' as bao_ho_toi
  from public.vkl_sm_tile t where t.mon_id is not null order by t.mon_id, t.chiem_luc nulls first;
