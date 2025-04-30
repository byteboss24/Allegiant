export interface CallRecordingItem {
  id: string
  audio_url: string
  [key: string]: any
}

export interface RecentCall {
  id: number
  invoice_number: string
  status: string
  duration: number
  created_at: string
  first_name: string
  last_name: string
}


export interface Invoice {
  id?: string
  first_name: string
  last_name: string
  mobile_number: string
  phone_number: string
  claim_reference: string
  invoice_number: string
  invoice_date: string
  invoice_amount: string
  fsp_name: string
  outstanding_amount: string
  email: string
  mailing_postcode: string
  payment_link?: string
  created_at: string
  status: string
  campaign_name?: string
  script?: string
  phone_strategy?: string
}

export interface ApiError {
  detail?: string
  message?: string
}

export interface Agent {
  id: number
  name: string
  voice: string
  status: string
  system_prompt: string
}

export interface TodayStatus {
  total_calls: number
  completed_calls: number
  other_calls: number
}

export interface MonthlyStats {
  total_invoices: number
  completed_invoices: number
  completion_rate: number
  total_calls: number
  completed_calls: number
  sms_sent_calls: number
}

export interface WeeklyStats {
  date: string
  total_calls: number
  completed_calls: number
  other_calls: number
}
