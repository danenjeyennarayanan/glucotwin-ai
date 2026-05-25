-- V3__fix_column_types.sql
-- Fix column types to match Java entity expectations

ALTER TABLE health_records ALTER COLUMN age TYPE FLOAT;
ALTER TABLE health_records ALTER COLUMN bmi TYPE FLOAT;
ALTER TABLE health_records ALTER COLUMN hba1c_level TYPE FLOAT;
ALTER TABLE health_records ALTER COLUMN blood_glucose_level TYPE FLOAT;