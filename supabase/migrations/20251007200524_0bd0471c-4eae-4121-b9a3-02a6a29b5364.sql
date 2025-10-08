-- Add column to store image data directly in the database
ALTER TABLE public.repair_images 
ADD COLUMN image_data bytea;

-- Make image_url nullable since we'll store data instead
ALTER TABLE public.repair_images 
ALTER COLUMN image_url DROP NOT NULL;