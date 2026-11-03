-- Sửa vkl_rollup_day: lifeNo bị sửa tay (10000000000) làm ép kiểu int lỗi, cron 1/11 không chạy.
-- Chỉ đổi đúng dòng ls: lifeNo không phải số 1-9 chữ số thì tính 0.
-- Chạy cả file trong SQL Editor, dòng cuối gom lại ngày 1/11.
do $$
declare src text;
begin
  src := pg_get_functiondef('vkl_rollup_day(date)'::regprocedure);
  src := replace(src,
    $a$coalesce((data->>'lifeNo')::int,0) ln$a$,
    $b$case when data->>'lifeNo' ~ '^[0-9]{1,9}$' then (data->>'lifeNo')::int else 0 end ln$b$);
  execute src;
end $$;

select vkl_rollup_day('2026-11-01');
select day, stats->'sid' sid from vkl_daily where day = '2026-11-01';
