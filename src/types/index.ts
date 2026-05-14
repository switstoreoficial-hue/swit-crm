export type LeadSource = "whatsapp" | "facebook" | "instagram";

export type Stage = 0 | 1 | 2 | 3 | 4 | 5;

export type UserName = "Diego" | "Kaio" | "Admin";

export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  company: string | null;
  source: LeadSource;
  stage: Stage;
  product_type: string | null;
  quantity: number | null;
  value: number | null;
  entry_value: number | null;
  tiny_order: string | null;
  assigned_to: string | null;
  notes: string | null;
  checklist: boolean[];
  logo_received: boolean;
  mockup_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeadHistory {
  id: string;
  lead_id: string;
  user_name: string;
  text: string;
  created_at: string;
}

export type NewLead = Pick<Lead, "name" | "whatsapp" | "company" | "source"> & {
  assigned_to: string;
};
