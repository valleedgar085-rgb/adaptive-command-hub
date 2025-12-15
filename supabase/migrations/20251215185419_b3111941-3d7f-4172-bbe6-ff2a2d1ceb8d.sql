-- Create table for tracking APK build progress
CREATE TABLE public.build_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  build_type TEXT NOT NULL DEFAULT 'apk',
  current_step INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 9,
  status TEXT NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user scripts
CREATE TABLE public.user_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  script_type TEXT NOT NULL DEFAULT 'build',
  commands JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_executed_at TIMESTAMP WITH TIME ZONE,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for script execution logs
CREATE TABLE public.script_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.user_scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  output TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.build_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.script_executions ENABLE ROW LEVEL SECURITY;

-- RLS policies for build_progress
CREATE POLICY "Users can view their own build progress" 
ON public.build_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own build progress" 
ON public.build_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own build progress" 
ON public.build_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own build progress" 
ON public.build_progress FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_scripts
CREATE POLICY "Users can view their own scripts" 
ON public.user_scripts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scripts" 
ON public.user_scripts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts" 
ON public.user_scripts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scripts" 
ON public.user_scripts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for script_executions
CREATE POLICY "Users can view their own script executions" 
ON public.script_executions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own script executions" 
ON public.script_executions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own script executions" 
ON public.script_executions FOR UPDATE USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_build_progress_updated_at
BEFORE UPDATE ON public.build_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_scripts_updated_at
BEFORE UPDATE ON public.user_scripts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();