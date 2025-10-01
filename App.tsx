import React, { useState } from 'react';
import Navbar from './components/Navbar';
import About from './pages/About';
import CreateBackup from './pages/CreateBackup';
import ImportBackup from './pages/ImportBackup';
import Profile from './pages/Profile';
import type { Page } from './types';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('About');

  const renderPage = () => {
    switch (activePage) {
      case 'About':
        return <About />;
      case 'Create Backup':
        return <CreateBackup setActivePage={setActivePage} />;
      case 'Import Backup':
        return <ImportBackup setActivePage={setActivePage} />;
      case 'Profile':
        return <Profile />;
      default:
        return <About />;
    }
  };

  return (
    <div className="min-h-screen bg-habitica-darker text-habitica-text-primary font-sans">
      <header className="bg-habitica-dark shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-habitica-light mb-4 sm:mb-0">Habitica Backup + Task Importer</h1>
            <Navbar activePage={activePage} setActivePage={setActivePage} />
          </div>
        </div>
      </header>
      <main className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {renderPage()}
        </div>
      </main>
      <footer className="text-center py-4 text-xs text-habitica-text-secondary">
        <p>This is a third-party tool and is not affiliated with Habitica.</p>
      </footer>
    </div>
  );
};

export default App;