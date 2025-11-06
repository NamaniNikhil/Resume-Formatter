
import React from 'react';
import { DocumentTextIcon } from './icons/DocumentTextIcon';
import { ArrowLeftOnRectangleIcon } from './icons/ArrowLeftOnRectangleIcon';
import { Squares2X2Icon } from './icons/Squares2X2Icon';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

interface HeaderProps {
  session: Session | null;
  onShowDashboard: () => void;
}

export const Header: React.FC<HeaderProps> = ({ session, onShowDashboard }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white shadow-md non-printable">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <DocumentTextIcon className="h-8 w-8 text-indigo-600" />
          <h1 className="ml-3 text-2xl font-bold text-gray-800 tracking-tight">
            Smart Resume Formatter
          </h1>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{session?.user?.email}</span>
            <button onClick={onShowDashboard} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors" title="Dashboard">
                <Squares2X2Icon className="h-5 w-5" />
                <span className="hidden md:inline">Dashboard</span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors" title="Logout">
                <ArrowLeftOnRectangleIcon className="h-5 w-5" />
                <span className="hidden md:inline">Logout</span>
            </button>
        </div>
      </div>
    </header>
  );
};
