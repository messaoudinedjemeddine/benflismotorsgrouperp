-- Add stage_completion_dates to vn_orders to track when each stage was completed
ALTER TABLE public.vn_orders 
ADD COLUMN stage_completion_dates JSONB DEFAULT '{}'::jsonb;

-- Create a trigger to automatically update stage_completion_dates when status changes
CREATE OR REPLACE FUNCTION public.update_stage_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If status has changed, record the completion date for the old status
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    NEW.stage_completion_dates = COALESCE(NEW.stage_completion_dates, '{}'::jsonb) || 
      jsonb_build_object(OLD.status::text, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_stage_completion
BEFORE UPDATE ON public.vn_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_stage_completion();