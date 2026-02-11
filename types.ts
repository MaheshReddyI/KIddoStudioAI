
export interface VideoProject {
  id: string;
  title: string;
  secondaryTitle: string;
  description: string;
  focus: string;
  tags: string[];
  visualPrompt: string;
  audioPrompt: string;
  icon: string;
  color: string;
}

export type GenerationStatus = 'idle' | 'authorizing' | 'generating-video' | 'generating-audio' | 'processing' | 'completed' | 'error';

export interface GeneratedContent {
  videoUrl?: string;
  audioUrl?: string;
  error?: string;
}
