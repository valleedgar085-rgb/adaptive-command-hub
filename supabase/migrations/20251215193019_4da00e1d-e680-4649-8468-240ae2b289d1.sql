-- Create table for saved SQL schemas
CREATE TABLE public.saved_schemas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tables JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_sql TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_schemas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own schemas"
ON public.saved_schemas
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schemas"
ON public.saved_schemas
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schemas"
ON public.saved_schemas
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schemas"
ON public.saved_schemas
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_schemas_updated_at
BEFORE UPDATE ON public.saved_schemas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();