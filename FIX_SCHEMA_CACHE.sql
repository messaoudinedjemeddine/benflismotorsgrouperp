-- Fix schema cache issue for VN orders
-- Run this in your Supabase SQL Editor

-- The issue is that the code is trying to save to columns that don't exist
-- Instead, all stage data should be saved to the stage_completion_dates JSONB column

-- This migration ensures the stage_completion_dates column exists and is properly configured
ALTER TABLE public.vn_orders 
ADD COLUMN IF NOT EXISTS stage_completion_dates JSONB DEFAULT '{}'::jsonb;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_vn_orders_stage_completion_dates 
ON public.vn_orders USING GIN (stage_completion_dates);

-- Verify the column exists
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'vn_orders' 
AND column_name = 'stage_completion_dates';

-- Test that we can update the column
UPDATE public.vn_orders 
SET stage_completion_dates = '{}'::jsonb 
WHERE stage_completion_dates IS NULL;

-- Show current structure
\d public.vn_orders;
