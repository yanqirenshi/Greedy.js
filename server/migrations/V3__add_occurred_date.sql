-- 物欲詳細テーブルに欲望発生日カラムを追加
ALTER TABLE desires ADD COLUMN occurred_date TIMESTAMPTZ;

-- 既存のデータの occurred_date を created_at で初期化
UPDATE desires SET occurred_date = created_at WHERE occurred_date IS NULL;
