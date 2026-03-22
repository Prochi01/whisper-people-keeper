ALTER TABLE people ADD COLUMN IF NOT EXISTS custom_questions text[] DEFAULT '{}';
ALTER TABLE people ADD COLUMN IF NOT EXISTS dismissed_questions text[] DEFAULT '{}';