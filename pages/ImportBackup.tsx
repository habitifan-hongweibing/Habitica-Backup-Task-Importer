import React, { useState, useEffect, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { HabiticaUserCredentials, HabiticaBackup, HabiticaTask, StoredBackup, TaskType, Page } from '../types';
import { createTask, fetchUserProfileName } from '../services/habiticaService';

interface ImportBackupProps {
    setActivePage: (page: Page) => void;
}

const ImportBackup: React.FC<ImportBackupProps> = ({ setActivePage }) => {
    const [savedCredentials] = useLocalStorage<HabiticaUserCredentials | null>('habitica-credentials', null);
    
    const [targetUserId, setTargetUserId] = useState(savedCredentials?.userId || '');
    const [targetApiToken, setTargetApiToken] = useState(savedCredentials?.apiToken || '');
    const [targetUsername, setTargetUsername] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    
    const [storedBackups, setStoredBackups] = useState<StoredBackup[]>([]);
    const [selectedBackup, setSelectedBackup] = useState<HabiticaBackup | null>(null);
    const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importStatus, setImportStatus] = useState<{message: string, progress: number, total: number} | null>(null);

    const [activeTab, setActiveTab] = useState<TaskType>('habit');

    useEffect(() => {
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
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content) as HabiticaBackup;
                    if (parsed.metadata && Array.isArray(parsed.tasks)) {
                        setSelectedBackup(parsed);
                        setSelectedTasks({});
                        setError(null);
                        setTargetUsername(null);
                    } else {
                        setError('Invalid backup file format.');
                    }
                } catch (err) {
                    setError('Failed to read or parse the backup file.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleVerifyTargetAccount = async () => {
        if (!targetUserId || !targetApiToken) {
            setError("Please provide both User ID and API Token for the target account.");
            return;
        }
        setIsVerifying(true);
        setError(null);
        setTargetUsername(null);
        try {
            const username = await fetchUserProfileName({ userId: targetUserId, apiToken: targetApiToken });
            setTargetUsername(username);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsVerifying(false);
        }
    };
    
    const tasksByType = useMemo(() => {
        if (!selectedBackup) return { habit: [], daily: [], todo: [] };
        return {
            habit: selectedBackup.tasks.filter(t => t.type === 'habit'),
            daily: selectedBackup.tasks.filter(t => t.type === 'daily'),
            todo: selectedBackup.tasks.filter(t => t.type === 'todo'),
        }
    }, [selectedBackup]);

    const handleSelectAll = (type: TaskType, select: boolean) => {
        const newSelectedTasks = { ...selectedTasks };
        tasksByType[type].forEach(task => {
            newSelectedTasks[task.id] = select;
        });
        setSelectedTasks(newSelectedTasks);
    };

    const handleImport = async () => {
        if (!targetUsername) {
            setError("Please verify the target account credentials before importing.");
            return;
        }
        const tasksToImport = selectedBackup?.tasks.filter(t => selectedTasks[t.id]) || [];
        if (tasksToImport.length === 0) {
            setError("No tasks selected for import.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setImportStatus({ message: 'Starting import...', progress: 0, total: tasksToImport.length });

        let importedCount = 0;
        try {
            for (const task of tasksToImport) {
                const { id, _id, userId, createdAt, updatedAt, ...taskToCreate } = task;
                await createTask({ userId: targetUserId, apiToken: targetApiToken }, taskToCreate);
                importedCount++;
                setImportStatus({
                    message: `Importing "${task.text}"...`,
                    progress: importedCount,
                    total: tasksToImport.length
                });
                await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
            }
            setImportStatus({ message: `Successfully imported ${importedCount} tasks!`, progress: importedCount, total: tasksToImport.length });
        } catch(err: any) {
            setError(err.message || "An unknown error occurred during import.");
            setImportStatus({ message: `Import failed after ${importedCount} tasks.`, progress: importedCount, total: tasksToImport.length });
        } finally {
            setIsLoading(false);
        }
    }
    
    const TaskSelection = ({ type, tasks }: { type: TaskType, tasks: HabiticaTask[] }) => (
        <div className="space-y-3">
             <div className="flex items-center space-x-4">
                <button onClick={() => handleSelectAll(type, true)} className="text-sm text-habitica-light hover:underline">Select All</button>
                <button onClick={() => handleSelectAll(type, false)} className="text-sm text-habitica-light hover:underline">Deselect All</button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 bg-habitica-darker p-2 rounded-md">
            {tasks.map(task => (
                <div key={task.id} className="flex items-center bg-habitica-main p-2 rounded">
                    <input type="checkbox" id={task.id} checked={!!selectedTasks[task.id]}
                        onChange={e => setSelectedTasks({...selectedTasks, [task.id]: e.target.checked})}
                        className="h-4 w-4 rounded border-gray-300 text-habitica-light focus:ring-habitica-light"
                    />
                    <label htmlFor={task.id} className="ml-3 block text-sm text-white">{task.text}</label>
                </div>
            ))}
            {tasks.length === 0 && <p className="text-habitica-text-secondary italic text-sm text-center py-4">No {type}s in this backup.</p>}
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto bg-habitica-dark p-6 rounded-lg shadow-xl space-y-6">
            <h1 className="text-3xl font-bold mb-4 text-center text-habitica-light">Import Backup</h1>
            
            {!selectedBackup && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    <div className="bg-habitica-main p-4 rounded-lg">
                        <h2 className="text-xl font-semibold mb-3 text-center">Load from device</h2>
                        <input type="file" accept=".json" onChange={handleFileChange} 
                          className="block w-full text-sm text-habitica-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-habitica-light file:text-white hover:file:bg-opacity-80"/>
                    </div>
                     <div className="bg-habitica-main p-4 rounded-lg">
                        <h2 className="text-xl font-semibold mb-3 text-center">Select a saved backup</h2>
                        {storedBackups.length > 0 ? (
                            <div className="max-h-48 overflow-y-auto space-y-2">
                            {storedBackups.map(b => (
                                <button key={b.key} onClick={() => { setSelectedBackup(b.data); setSelectedTasks({}); setTargetUsername(null); }}
                                  className="w-full text-left p-3 bg-habitica-darker hover:bg-habitica-light rounded-md transition">
                                    <p className="font-semibold">{b.username}'s Backup</p>
                                    <p className="text-xs text-habitica-text-secondary">{new Date(b.createdAt).toLocaleString()}</p>
                                    <p className="text-xs text-habitica-text-secondary">
                                        H: {b.taskCounts.habits}, D: {b.taskCounts.dailys}, T: {b.taskCounts.todos}
                                    </p>
                                </button>
                            ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-habitica-text-secondary italic">No backups found in browser storage.</p>
                        )}
                    </div>
                </div>
            )}

            {selectedBackup && (
                <div className="space-y-6">
                     <button onClick={() => setSelectedBackup(null)} className="text-sm text-habitica-light hover:underline">← Select a different backup</button>
                     <div className="bg-habitica-main p-4 rounded-lg">
                        <p className="text-sm text-habitica-text-secondary">
                           <strong>Tip:</strong> A backup file is just a text file. You can open it in any editor (like Notepad or VS Code) and remove tasks you don't want to share before sending it to a friend. This way, you can create and distribute your own productivity systems and themed task sets (e.g., "Morning Rituals" or "Getting Things Done System").
                        </p>
                     </div>
                     
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-center text-white">Select Tasks to Import</h2>
                        <div className="border-b border-habitica-main">
                            <nav className="-mb-px flex space-x-8 justify-center" aria-label="Tabs">
                                {(['habit', 'daily', 'todo'] as TaskType[]).map(tab => (
                                    <button key={tab} onClick={() => setActiveTab(tab)}
                                        className={`${tab === activeTab ? 'border-habitica-light text-habitica-light' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}
                                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}>
                                        {tab}s
                                    </button>
                                ))}
                            </nav>
                        </div>
                        <div className="pt-4">
                            {activeTab === 'habit' && <TaskSelection type="habit" tasks={tasksByType.habit} />}
                            {activeTab === 'daily' && <TaskSelection type="daily" tasks={tasksByType.daily} />}
                            {activeTab === 'todo' && <TaskSelection type="todo" tasks={tasksByType.todo} />}
                        </div>
                    </div>
                     
                    <div className="space-y-4 pt-4 border-t border-habitica-main">
                         <h2 className="text-xl font-bold text-center text-white">Target Account</h2>
                          <div className="max-w-lg mx-auto space-y-3">
                            <div>
                                <label htmlFor="targetUserId" className="block text-sm font-medium text-habitica-text-secondary mb-1">User ID</label>
                                <input type="text" id="targetUserId" value={targetUserId} onChange={(e) => { setTargetUserId(e.target.value); setTargetUsername(null); }} className="w-full bg-habitica-main border border-habitica-light rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-habitica-light" placeholder="User ID of the account to import into"/>
                            </div>
                             <div>
                                <label htmlFor="targetApiToken" className="block text-sm font-medium text-habitica-text-secondary mb-1">API Token</label>
                                <input type="password" id="targetApiToken" value={targetApiToken} onChange={(e) => { setTargetApiToken(e.target.value); setTargetUsername(null); }} className="w-full bg-habitica-main border border-habitica-light rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-habitica-light" placeholder="API Token of the account to import into"/>
                            </div>
                            <button onClick={handleVerifyTargetAccount} disabled={isVerifying} className="w-full bg-habitica-light hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-all disabled:bg-gray-500">
                                {isVerifying ? 'Verifying...' : 'Verify Target Account'}
                            </button>
                             {targetUsername && <p className="text-center text-green-400">Verified! Importing to: <span className="font-bold">{targetUsername}</span></p>}
                          </div>

                         <button onClick={handleImport} disabled={isLoading || !targetUsername} className="w-full bg-habitica-light hover:bg-opacity-80 text-white font-bold py-3 px-4 rounded-md transition-all disabled:bg-gray-500 disabled:cursor-not-allowed">
                             {isLoading ? 'Importing...' : `Import ${Object.values(selectedTasks).filter(Boolean).length} Selected Tasks`}
                         </button>
                    </div>

                    {importStatus && (
                        <div className="bg-habitica-main p-4 rounded-lg">
                           <p className="text-center mb-2">{importStatus.message}</p>
                           {isLoading && (
                            <div className="w-full bg-habitica-darker rounded-full h-2.5">
                               <div className="bg-green-500 h-2.5 rounded-full" style={{width: `${(importStatus.progress / importStatus.total) * 100}%`}}></div>
                            </div>
                           )}
                        </div>
                    )}
                </div>
            )}

            {error && <div className="bg-red-900 border border-red-500 text-red-200 px-4 py-3 rounded-md text-center">{error}</div>}
        </div>
    );
};

export default ImportBackup;