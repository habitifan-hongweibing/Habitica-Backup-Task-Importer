import React, { useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { HabiticaUserCredentials, StoredBackup, HabiticaBackup } from '../types';

const Profile: React.FC = () => {
  const [credentials, setCredentials] = useLocalStorage<HabiticaUserCredentials | null>('habitica-credentials', null);
  const [userId, setUserId] = useState(credentials?.userId || '');
  const [apiToken, setApiToken] = useState(credentials?.apiToken || '');
  const [saved, setSaved] = useState(false);
  const [storedBackups, setStoredBackups] = useState<StoredBackup[]>([]);

  const loadBackups = () => {
    const backups: StoredBackup[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('habitica-backup_')) {
            try {
                const data: HabiticaBackup = JSON.parse(localStorage.getItem(key)!);
                backups.push({
                    key,
                    createdAt: data.metadata.createdAt,
                    username: data.metadata.username,
                    taskCounts: {
                        habits: data.tasks.filter(t => t.type === 'habit').length,
                        dailys: data.tasks.filter(t => t.type === 'daily').length,
                        todos: data.tasks.filter(t => t.type === 'todo').length,
                    },
                    data: data,
                });
            } catch (e) {
                console.error(`Failed to parse backup from localStorage with key ${key}`, e);
            }
        }
    }
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setStoredBackups(backups);
  };

  useEffect(() => {
    loadBackups();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key?.startsWith('habitica-backup_') || e.key === null || e.key === 'habitica-credentials') {
            loadBackups();
        }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);



  const handleSave = () => {
    setCredentials({ userId, apiToken });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDeleteBackup = (key: string) => {
    if (window.confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
        localStorage.removeItem(key);
        // Dispatch event to notify other components, like ImportBackup
        window.dispatchEvent(new StorageEvent('storage', { key }));
        loadBackups(); // Reload immediately for this component
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Credentials Section */}
      <div className="bg-habitica-dark p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-habitica-light">User Profile</h1>

        <div className="space-y-4 mb-8 max-w-lg mx-auto">
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-habitica-text-secondary mb-1">User ID</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full bg-habitica-main border border-habitica-light rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-habitica-light"
              placeholder="e.g., f3e1b5b0-a3a8-4c8d-8a21-12a8a8a4b8b8"
            />
          </div>
          <div>
            <label htmlFor="apiToken" className="block text-sm font-medium text-habitica-text-secondary mb-1">API Token</label>
            <input
              type="password"
              id="apiToken"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              className="w-full bg-habitica-main border border-habitica-light rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-habitica-light"
              placeholder="Enter your API Token"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full bg-habitica-light hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors"
          >
            {saved ? 'Credentials Saved!' : 'Save Default Credentials'}
          </button>
        </div>

        <div className="bg-habitica-main p-4 rounded-md max-w-lg mx-auto">
          <h2 className="text-xl font-semibold mb-2 text-white">How to find your credentials</h2>
          <ol className="list-decimal list-inside space-y-2 text-habitica-text-secondary">
            <li>Log in to your <a href="https://habitica.com" target="_blank" rel="noopener noreferrer" className="text-habitica-light underline">Habitica</a> account.</li>
            <li>Go to <strong>Settings</strong> &gt; <strong>API</strong>.</li>
            <li>Copy your <strong>User ID</strong> and <strong>API Token</strong>.</li>
          </ol>
          <p className="mt-4 text-sm text-habitica-text-secondary">
            Your credentials are saved securely in your browser's local storage and are never sent to any server.
          </p>
        </div>
      </div>
      
      {/* Backups Section */}
      <div className="bg-habitica-dark p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-habitica-light">Manage Backups</h1>
        <div className="space-y-4">
            {storedBackups.length > 0 ? (
                storedBackups.map(backup => (
                    <div key={backup.key} className="bg-habitica-main p-4 rounded-md flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className='flex-grow'>
                            <p className="font-semibold">{backup.username}'s Backup</p>
                            <p className="text-sm text-habitica-text-secondary">{new Date(backup.createdAt).toLocaleString()}</p>
                            <p className="text-sm text-habitica-text-secondary">
                                Tasks - H: {backup.taskCounts.habits}, D: {backup.taskCounts.dailys}, T: {backup.taskCounts.todos}
                            </p>
                        </div>
                        <div className="flex-shrink-0 mt-4 sm:mt-0">
                            <button onClick={() => handleDeleteBackup(backup.key)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors text-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-habitica-text-secondary italic">No backups found in browser storage. Create one from the "Create Backup" page.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default Profile;