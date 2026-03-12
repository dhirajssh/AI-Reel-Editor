export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  id: number;
  project_id: number;
  status: JobStatus;
  progress_message: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface Transcript {
  id: number;
  full_text: string;
  word_timestamps_json: Array<{ word: string; start: number; end: number }>;
  caption_segments_json: Array<{
    line_start: number;
    line_end: number;
    text: string;
    words: Array<{ word: string; start: number; end: number }>;
  }>;
  created_at: string;
}

export interface Project {
  id: number;
  user_id: number | null;
  guest_session_id: string | null;
  title: string;
  original_filename: string;
  original_file_path: string;
  processed_file_path: string | null;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}

export interface ProjectDetail extends Project {
  transcript: Transcript | null;
  latest_job: Job | null;
}

