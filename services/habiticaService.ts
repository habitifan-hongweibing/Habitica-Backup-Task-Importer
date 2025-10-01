import type { HabiticaUserCredentials, HabiticaTask } from '../types';

const API_BASE_URL = 'https://habitica.com/api/v3';

const getHeaders = (credentials: HabiticaUserCredentials) => ({
  'Content-Type': 'application/json',
  'x-api-user': credentials.userId,
  'x-api-key': credentials.apiToken,
  'x-client': 'habitica-backup-importer-app',
});

interface FetchUserDataResponse {
  tasks: HabiticaTask[];
  username: string;
}

export const fetchUserProfileName = async (credentials: HabiticaUserCredentials): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/user`, {
    headers: getHeaders(credentials),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch user profile name. Check credentials.');
  }
  const data = await response.json();
  return data.data?.profile?.name || 'Unknown User';
};


export const fetchUserData = async (credentials: HabiticaUserCredentials): Promise<FetchUserDataResponse> => {
  const headers = getHeaders(credentials);

  const [habitsResponse, dailysResponse, todosResponse, userResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/tasks/user?type=habits`, { headers }),
      fetch(`${API_BASE_URL}/tasks/user?type=dailys`, { headers }),
      fetch(`${API_BASE_URL}/tasks/user?type=todos`, { headers }),
      fetch(`${API_BASE_URL}/user`, { headers })
  ]);

  const responses = { habitsResponse, dailysResponse, todosResponse, userResponse };
  for (const [name, response] of Object.entries(responses)) {
      if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred' }));
          throw new Error(`Failed to fetch ${name.replace('Response', '')} from Habitica: ${errorData.message}`);
      }
  }

  const habitsData = await habitsResponse.json();
  const dailysData = await dailysResponse.json();
  const todosData = await todosResponse.json();
  const userData = await userResponse.json();

  const tasks: HabiticaTask[] = [
      ...(habitsData.data || []),
      ...(dailysData.data || []),
      ...(todosData.data || [])
  ];
  
  const username: string = userData.data?.profile?.name || 'Unknown User';
  
  return { 
      tasks, 
      username
  };
};


export const createTask = async (credentials: HabiticaUserCredentials, task: Omit<HabiticaTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/tasks/user`, {
        method: 'POST',
        headers: getHeaders(credentials),
        body: JSON.stringify(task),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create task "${task.text}": ${errorData.message}`);
    }

    return await response.json();
}