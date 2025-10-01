import React, { useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { HabiticaUserCredentials, HabiticaBackup, Page } from '../types';
import { fetchUserData, fetchUserProfileName } from '../services/habiticaService';

interface CreateBackupProps {
  setActivePage: (page: Page) => void;
}

const CreateBackup: React.FC<CreateBackupProps> = ({ setActivePage }) => {
  const [credentials] = useLocalStorage<HabiticaUserCredentials | null>('habitica-credentials', null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupPreview, setBackupPreview] = useState<HabiticaBackup | null>(null);

  useEffect(() => {
    if (!credentials?.userId || !credentials?.apiToken) {
      setActivePage('Profile');
    } else {
      setUsername(null);
      setError(null);
      setIsLoading(true);
      fetchUserProfileName(credentials)
        .then(setUsername)
        .catch(err => {
            console.error("Failed to fetch username:", err);
            setError("Failed to fetch username. Please check your credentials on the Profile page.");
        })
        .finally(() => setIsLoading(false));
    }
  }, [credentials, setActivePage]);

  const handleCreateBackup = async () => {
    if (!credentials?.userId || !credentials?.apiToken) {
      setError('Please set your User ID and API Token in the Profile page first.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setBackupPreview(null);

    try {
      const { tasks, username: fetchedUsername } = await fetchUserData({ userId: credentials.userId, apiToken: credentials.apiToken });
      
      const backupData: HabiticaBackup = {
        metadata: {
          createdAt: new Date().toISOString(),
          source: 'Habitica Backup + Task Importer',
          username: fetchedUsername,
        },
        tasks: tasks,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      const safeUsername = fetchedUsername.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'user';
      a.href = url;
      a.download = `habitica_backup_${safeUsername}_${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      const backupKey = `habitica-backup_${new Date().getTime()}`;
      localStorage.setItem(backupKey, jsonString);
      window.dispatchEvent(new StorageEvent('storage', { key: backupKey }));

      setBackupPreview(backupData);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getTaskCount = (type: 'habit' | 'daily' | 'todo') => {
    return backupPreview?.tasks.filter(t => t.type === type).length || 0;
  }

  if (!credentials?.userId || !credentials?.apiToken) {
    return (
        <div className="max-w-2xl mx-auto bg-habitica-dark p-6 rounded-lg shadow-xl text-center">
            <h2 className="text-xl font-bold mb-4 text-habitica-light">Credentials Required</h2>
            <p className="text-habitica-text-secondary">Redirecting you to the Profile page to enter your credentials...</p>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-habitica-dark p-6 rounded-lg shadow-xl space-y-6">
      <h1 className="text-3xl font-bold text-center text-habitica-light">Create Backup</h1>

      <div className="bg-habitica-main p-4 rounded-lg text-center">
          <p className="text-habitica-text-secondary">
              Using credentials for Habitica user:
          </p>
          <p className="font-bold text-lg text-white">{username || 'Loading...'}</p>
      </div>
      
      <button
        onClick={handleCreateBackup}
        disabled={isLoading}
        className="w-full bg-habitica-light hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded-md transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Creating Backup...' : 'Create Backup'}
      </button>

      {error && <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-md text-center">{error}</div>}

      {backupPreview && (
        <div className="bg-habitica-main p-6 rounded-lg shadow-inner space-y-4">
          <h2 className="text-xl font-bold text-center text-white">Backup Preview</h2>
          <div className="bg-habitica-darker p-4 rounded-md">
              <h3 className="font-semibold text-center mb-2">Task Summary</h3>
              <div className="grid grid-cols-3 text-center">
                  <div><div className="font-bold text-lg">{getTaskCount('habit')}</div><div className="text-xs">Habits</div></div>
                  <div><div className="font-bold text-lg">{getTaskCount('daily')}</div><div className="text-xs">Dailies</div></div>
                  <div><div className="font-bold text-lg">{getTaskCount('todo')}</div><div className="text-xs">Todos</div></div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateBackup;