export type Page = 'About' | 'Create Backup' | 'Import Backup' | 'Profile';

export interface HabiticaUserCredentials {
  userId: string;
  apiToken: string;
}

export type TaskType = 'habit' | 'daily' | 'todo';

export interface HabiticaTask {
  _id?: string;
  userId?: string;
  challenge?: object;
  group?: object;
  id: string;
  text: string;
  notes?: string;
  tags?: string[];
  type: TaskType;
  priority?: number;
  value?: number;
  checklist?: { text: string; completed: boolean; id: string }[];
  reminders?: any[];
  createdAt: string;
  updatedAt: string;
  // daily specific
  isDue?: boolean;
  frequency?: string;
  everyX?: number;
  startDate?: string;
  // habit specific
  up?: boolean;
  down?: boolean;
  counterUp?: number;
  counterDown?: number;
}

export interface HabiticaBackup {
  metadata: {
    createdAt: string;
    source: string;
    username: string;
  };
  tasks: HabiticaTask[];
}

export interface StoredBackup {
  key: string;
  createdAt: string;
  taskCounts: {
    habits: number;
    dailys: number;
    todos: number;
  };
  username: string;
  data: HabiticaBackup;
}