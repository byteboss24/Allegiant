// API functions for all resources in the frontend
import type { ApiError, Invoice, Agent } from "@/lib/props";
import { CloudCog } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const username = process.env.NEXT_PUBLIC_USERNAME;
const password = process.env.NEXT_PUBLIC_PASSWORD;
const credentials = username && password ? btoa(`${username}:${password}`) : undefined;

// Calls APIs
export async function fetchRecords(page: number, perPage: number) {
  const response = await fetch(`${API_BASE_URL}/api/v1/records?page=${page}&per_page=${perPage}`);
  if (!response.ok) throw new Error('Failed to fetch records');
  return response.json();
}

export async function fetchAudio(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: credentials ? { 'Authorization': `Basic ${credentials}` } : {},
  });
  if (!response.ok) throw new Error('Failed to fetch audio');
  return response.blob();
}

export async function deleteRecording(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/record/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(credentials ? { 'Authorization': `Basic ${credentials}` } : {}),
    },
  });
  if (!response.ok) throw new Error('Failed to delete recording');
  return response;
}

export async function deleteMultipleRecordings(ids: string[]) {
  const results = [];
  for (const id of ids) {
    results.push(await deleteRecording(id));
  }
  return results;
}

export async function fetchRecentCalls() {
  const response = await fetch(`${API_BASE_URL}/api/v1/record/recent`);
  if (!response.ok) throw new Error('Failed to fetch recent calls');
  return response.json();
}

export async function fetchWeeklyStats() {
  const response = await fetch(`${API_BASE_URL}/api/v1/record/week`);
  if (!response.ok) throw new Error('Failed to fetch weekly stats');
  return response.json();
}

export async function fetchTodayStatus() {
  const response = await fetch(`${API_BASE_URL}/api/v1/records/today`);
  if (!response.ok) throw new Error('Failed to fetch today status');
  return response.json();
}

// Invoices APIs
export async function fetchInvoices(): Promise<Invoice[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/invoices`);
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to fetch invoices');
  }
  return response.json();
}

export async function fetchCustomerDetails(invoice_number: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/invoices/${invoice_number}`);
  if (!response.ok) throw new Error('Failed to fetch customer details');
  return response.json();
}

export async function uploadCsv(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/api/v1/invoices/upload-csv`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Upload failed');
  }
  return data;
}

export async function updateInvoiceStatus(invoiceNumber: string, status: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/invoices/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_number: invoiceNumber, status }),
  });
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update status');
  }
  return response.json();
}

export async function deleteInvoices(invoiceNumbers: string[]) {
  const response = await fetch(`${API_BASE_URL}/api/v1/invoices/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoice_numbers: invoiceNumbers }),
  });
  if (!response.ok) {
    let errorData: ApiError = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // Ignore JSON parse error, use generic message
    }
    throw new Error(errorData.detail || 'Failed to delete invoices');
  }
  if (response.status !== 204) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  return null;
}

export async function exportInvoicesCsv() {
  const response = await fetch(`${API_BASE_URL}/api/v1/invoices/export/csv`);
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Export failed');
  }
  return response;
}

export async function fetchMonthlyStats() {
  const response = await fetch(`${API_BASE_URL}/api/v1/invoices/month`);
  if (!response.ok) throw new Error('Failed to fetch monthly stats');
  return response.json();
}

// Agent APIs
export async function fetchAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/agents`);
  if (!response.ok) throw new Error('Failed to fetch agents');
  return response.json();
}

export async function fetchSelectedAgent() {
  const response = await fetch(`${API_BASE_URL}/api/v1/selected-agent`);
  if (!response.ok) throw new Error('Failed to fetch selected agent');
  return response.json();
}

export async function selectAgent(agentId: number) {
  const response = await fetch(`${API_BASE_URL}/api/v1/select-agent/${agentId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) throw new Error('Failed to select agent');
  return response.json();
}

export async function updateAgent(agent: Agent) {
  const response = await fetch(`${API_BASE_URL}/api/v1/agents`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent),
  });
  if (!response.ok) throw new Error('Failed to update agent');
  return response.json();
}

// Word Pronunciation APIs
export async function fetchWordPronunciations(agentId?: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/word-pronunciations?agent_id=${agentId || ''}`);
  if (!res.ok) throw new Error('Failed to fetch word pronunciations');
  return res.json();
}

export async function addWordPronunciation(word: string, pronunciation: string, agentId?: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/word-pronunciations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, pronunciation, agent_id: agentId }),
  });
  if (!res.ok) throw new Error('Failed to add word pronunciation');
  return res.json();
}

export async function updateWordPronunciation(id: number, word: string, pronunciation: string, agentId?: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/word-pronunciations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word, pronunciation, agent_id: agentId }),
  });
  if (!res.ok) throw new Error('Failed to update word pronunciation');
  return res.json();
}

export async function deleteWordPronunciation(id: number) {
  const res = await fetch(`${API_BASE_URL}/api/v1/word-pronunciations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete word pronunciation');
  return res.json();
}

// Auth APIs
export async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Login failed');
  }
  return data;
}

// Miscellaneous APIs (for local endpoints)
export async function deleteInvoice(id: string) {
  const response = await fetch(`/api/v1/invoice/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete invoice');
  return response;
}

export async function uploadCsvLocal(formData: FormData) {
  const response = await fetch('/api/v1/invoices/upload-csv', {
    method: 'POST',
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Upload failed');
  }
  return data;
}

export async function controlTwilioCall(control_type: 'start_call' | 'stop_call') {
  const response = await fetch(`${API_BASE_URL}/twilio/control_call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ control_type }),
  });
  if (!response.ok) throw new Error('Failed to control Twilio call');
  return response.json();
}
