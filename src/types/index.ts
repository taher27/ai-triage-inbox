export type Status = 'new' | 'in_progress' | 'done';
export type Priority = 'P1' | 'P2' | 'P3';
export type Channel = 'email' | 'chat' | 'phone';
export type AICategory =
  | 'Billing'
  | 'Claims'
  | 'Endorsement'
  | 'General'
  | 'Urgent'
  | 'Spam'
  | 'Technical'
  | 'Legal'
  | 'Complaint';

export interface Sender {
  name: string;
  email: string;
  company: string;
}

export interface Message {
  id: string;
  sender: Sender;
  subject: string;
  body: string;
  receivedAt: string; // ISO 8601
  channel: Channel;
  status: Status;
  priority: Priority;
  tags: string[];
  notes: string;
}

export interface AIResult {
  summary_bullets: string[];
  category: AICategory;
  priority: Priority;
  suggested_action: string;
  draft_reply: string;
  confidence: number; // 0–1
}

export type AIStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AIState {
  result: AIResult | null;
  status: AIStatus;
  error: string | null;
  streamedDraft: string;
  isStreaming: boolean;
  userEditedDraft: boolean;
}
