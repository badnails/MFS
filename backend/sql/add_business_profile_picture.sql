-- SQL script to add profile picture support for business accounts
-- Add profile_picture field to institutionalinfo table

ALTER TABLE institutionalinfo 
ADD COLUMN IF NOT EXISTS profile_picture BYTEA,
ADD COLUMN IF NOT EXISTS profile_picture_mime_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS profile_picture_filename VARCHAR(255),
ADD COLUMN IF NOT EXISTS profile_picture_upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_institutionalinfo_profile_picture 
ON institutionalinfo(accountid) WHERE profile_picture IS NOT NULL;
