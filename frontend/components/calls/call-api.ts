const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const username = process.env.NEXT_PUBLIC_USERNAME;
const password = process.env.NEXT_PUBLIC_PASSWORD;

const credentials = btoa(`${username}:${password}`);

export async function fetchRecords(page: number, perPage: number) {
  const response = await fetch(`${API_BASE_URL}/api/v1/records?page=${page}&per_page=${perPage}`);
  if (!response.ok) throw new Error('Failed to fetch records');
  return response.json();
}

export async function fetchAudio(url: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${credentials}`
    }
  });
  if (!response.ok) throw new Error('Failed to fetch audio');
  return response.blob();
}

export async function deleteRecording(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/v1/record/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${credentials}`
    }
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