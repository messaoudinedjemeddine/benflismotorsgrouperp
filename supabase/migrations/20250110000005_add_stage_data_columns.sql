-- Add missing columns for VN order stage data
-- These columns store the actual stage-specific data

-- Add call_result column for INSCRIPTION stage
ALTER TABLE public.vn_orders 
ADD COLUMN IF NOT EXISTS call_result TEXT;

-- Add document_uploaded columns for various stages
ALTER TABLE public.vn_orders 
ADD COLUMN IF NOT EXISTS proforma_document_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS commande_document_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS validation_document_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS accuse_document_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS arrivage_document_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS livraison_document_uploaded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS dossier_daira_document_uploaded BOOLEAN DEFAULT FALSE;

-- Add specific stage data columns
ALTER TABLE public.vn_orders 
ADD COLUMN IF NOT EXISTS trop_percu NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS avaries TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS scan_facture BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS carte_jaune BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS delivery_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN public.vn_orders.call_result IS 'Call result for INSCRIPTION stage';
COMMENT ON COLUMN public.vn_orders.proforma_document_uploaded IS 'Whether proforma document is uploaded';
COMMENT ON COLUMN public.vn_orders.commande_document_uploaded IS 'Whether purchase order document is uploaded';
COMMENT ON COLUMN public.vn_orders.validation_document_uploaded IS 'Whether validation document is uploaded';
COMMENT ON COLUMN public.vn_orders.accuse_document_uploaded IS 'Whether acknowledgement document is uploaded';
COMMENT ON COLUMN public.vn_orders.arrivage_document_uploaded IS 'Whether route sheet document is uploaded';
COMMENT ON COLUMN public.vn_orders.livraison_document_uploaded IS 'Whether delivery note document is uploaded';
COMMENT ON COLUMN public.vn_orders.dossier_daira_document_uploaded IS 'Whether daira document is uploaded';
COMMENT ON COLUMN public.vn_orders.avaries IS 'Vehicle damages for ARRIVAGE stage';
COMMENT ON COLUMN public.vn_orders.scan_facture IS 'Whether invoice scan is uploaded for CARTE_JAUNE';
COMMENT ON COLUMN public.vn_orders.carte_jaune IS 'Whether yellow card is uploaded for CARTE_JAUNE';
COMMENT ON COLUMN public.vn_orders.delivery_date IS 'Provisional delivery date for LIVRAISON stage';
