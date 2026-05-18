-- Columnas que faltan en matches si la BD se creó antes del schema completo
-- Error típico: Could not find the 'updated_by' column of 'matches' in the schema cache

ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS home_penalties INT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS away_penalties INT;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS elimination_slot_label TEXT;

ALTER TABLE public.honor_results ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.honor_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

NOTIFY pgrst, 'reload schema';
