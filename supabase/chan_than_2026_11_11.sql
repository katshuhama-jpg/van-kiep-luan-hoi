-- 4.5.0 Chân Thân: lọc pháp danh trên máy chủ (bản giống lib/game/tenCam.ts).
-- Hàm mới, không sửa hàm cũ:
--   vkl_ct_bo_dau(text)    bỏ dấu tiếng Việt, viết thường
--   vkl_ct_name_ok(text)   true nếu pháp danh hợp lệ (2-12 chữ cái, chỉ chữ và khoảng trắng, không từ cấm)
-- ĐÃ CHẠY 10/11 (migration chan_than_ten_2026_11_11): hai hàm trên. Màn tạo và đổi tên gọi vkl_ct_name_ok trước khi lưu.
--
-- CHƯA CHẠY (bị chặn khi áp, chờ Tyler quyết): trigger vkl_ct_guard_trg trên vkl_players để hồ sơ lưu thẳng lên
-- (không qua màn tạo) có pháp danh bị chặn thì giữ tên cũ hoặc "Vô Danh". Phần này ở cuối file.

create or replace function public.vkl_ct_bo_dau(p text) returns text
language sql immutable as $$
  select lower(translate(coalesce(p, ''),
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ',
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD'))
$$;

create or replace function public.vkl_ct_name_ok(p_name text) returns boolean
language plpgsql immutable as $$
declare
  s text := btrim(regexp_replace(normalize(coalesce(p_name, ''), NFC), '\s+', ' ', 'g'));
  flat text;
  joined text;
  joined1 text;
  w text;
  vi text[] := array['ditme','ditmia','dmm','dcmm','dkm','dmcs','vcl','vkl','vcc','clgt','cmm','cmnr','occho','occac','nunglon','nungloz','phangteo','dilon','lozz','buoj','concac','conkac','thangcho','conchode','chodeo'];
  en text[] := array['fuck','shit','bitch','cunt','dick','pussy','porn','sex','nigg','hitler','nazi','rape','whore','slut'];
  rieng text[] := array['dm','dcm','cl','vl','cc','lz','loz','dj','djt','dit','deo','lon','buoi','cac','cak','cax','dmm'];
  dau text[] := array['đụ','địt','đít','đéo','lồn','buồi','cặc','đĩ','đcm','đm'];
begin
  if char_length(s) < 2 or char_length(s) > 12 then return false; end if;
  if s !~ '^[[:alpha:] ]+$' then return false; end if;
  flat := public.vkl_ct_bo_dau(s);
  joined := replace(flat, ' ', '');
  joined1 := regexp_replace(joined, '(.)\1+', '\1', 'g');
  foreach w in array vi loop
    if position(w in joined) > 0 then return false; end if;
  end loop;
  foreach w in array en loop
    if position(w in joined) > 0 or position(regexp_replace(w, '(.)\1+', '\1', 'g') in joined1) > 0 then return false; end if;
  end loop;
  foreach w in array string_to_array(flat, ' ') loop
    if w = any(rieng) then return false; end if;
  end loop;
  foreach w in array string_to_array(lower(s), ' ') loop
    if w = any(dau) then return false; end if;
  end loop;
  return true;
end $$;

grant execute on function public.vkl_ct_name_ok(text) to anon, authenticated;

-- ===== CHƯA CHẠY: trigger chặn pháp danh khi lưu hồ sơ =====
/*
create or replace function public.vkl_ct_guard() returns trigger
language plpgsql as $$
declare
  nm text;
  old_nm text;
begin
  begin
    nm := new.meta #>> '{chanThan,name}';
    if nm is not null and not public.vkl_ct_name_ok(nm) then
      old_nm := case when tg_op = 'UPDATE' then old.meta #>> '{chanThan,name}' else null end;
      if old_nm is null or not public.vkl_ct_name_ok(old_nm) then old_nm := 'Vô Danh'; end if;
      new.meta := jsonb_set(new.meta, '{chanThan,name}', to_jsonb(old_nm));
    end if;
  exception when others then
    return new;
  end;
  return new;
end $$;

drop trigger if exists vkl_ct_guard_trg on public.vkl_players;
create trigger vkl_ct_guard_trg before insert or update of meta on public.vkl_players
  for each row execute function public.vkl_ct_guard();

*/
