-- 物欲詳細テーブルに成就日カラムを追加
ALTER TABLE desires ADD COLUMN fulfilled_date TIMESTAMPTZ;
