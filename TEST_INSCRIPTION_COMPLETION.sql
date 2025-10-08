-- Test script to verify INSCRIPTION stage completion works
-- Run this in your Supabase SQL Editor after the fix

-- Check if the vn_orders table has the required columns
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vn_orders' 
AND column_name IN ('stage_completion_dates', 'vehicle_vin', 'trop_percu', 'location', 'vehicle_avaries');

-- Test updating stage_completion_dates (this should work)
UPDATE public.vn_orders 
SET stage_completion_dates = jsonb_set(
  COALESCE(stage_completion_dates, '{}'::jsonb),
  '{INSCRIPTION}',
  jsonb_build_object(
    'completed_at', now()::text,
    'data', jsonb_build_object('callResult', 'Test call result')
  )
)
WHERE id = (SELECT id FROM public.vn_orders LIMIT 1);

-- Verify the update worked
SELECT id, stage_completion_dates 
FROM public.vn_orders 
WHERE stage_completion_dates ? 'INSCRIPTION';

-- Show the structure of stage_completion_dates
SELECT 
  id,
  stage_completion_dates->'INSCRIPTION'->>'completed_at' as completed_at,
  stage_completion_dates->'INSCRIPTION'->'data'->>'callResult' as call_result
FROM public.vn_orders 
WHERE stage_completion_dates ? 'INSCRIPTION';
