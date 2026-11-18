export interface Source {
  id?: string;
  guideline_id?: string;
  title: string;
  organization: string;
  documentType?: string;
  page?: string | number;
  section?: string;
  excerpt?: string;
  url?: string;
  source_url?: string;
  pdf_url?: string;
  is_verified?: boolean;
  similarity?: number;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  type?: 'greeting' | 'healthcare' | 'out_of_scope' | 'unclear';
  question?: string;
  content: string;
  recommendation?: string;
  whyThisApplies?: string[];
  evidence?: string;
  category?: string;
  sources?: Source[];
  demo?: boolean;
  decision?: 'accepted' | 'rejected' | 'modified';
  decisionRationale?: string;
  decisionId?: string;
  finalDecision?: string;
  timestamp: string;
}
