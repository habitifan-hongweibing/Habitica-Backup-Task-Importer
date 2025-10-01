import React from 'react';
import type { Page } from '../types';

interface NavbarProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activePage, setActivePage }) => {
  const pages: Page[] = ['About', 'Create Backup', 'Import Backup', 'Profile'];

  return (
    <nav className="flex flex-wrap justify-center space-x-2 sm:space-x-4">
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => setActivePage(page)}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activePage === page
              ? 'bg-habitica-light text-white'
              : 'text-habitica-text-secondary hover:bg-habitica-main hover:text-white'
          }`}
        >
          {page}
        </button>
      ))}
    </nav>
  );
};

export default Navbar;
