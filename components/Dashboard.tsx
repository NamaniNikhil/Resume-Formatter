
import React from 'react';
import { SavedResume } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { PlusCircleIcon } from './icons/PlusCircleIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface DashboardProps {
  resumes: SavedResume[];
  onLoad: (resume: SavedResume) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onNewResume: () => void;
  isLoading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({ resumes, onLoad, onDelete, onClose, onNewResume, isLoading }) => {
  return (
    <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">My Resumes</h1>
                <div>
                     <button onClick={onNewResume} className="mr-4 inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
                        <PlusCircleIcon className="h-5 w-5"/>
                        New Resume
                    </button>
                    <button onClick={onClose} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        <ArrowUturnLeftIcon className="h-5 w-5" />
                        Back to Editor
                    </button>
                </div>
            </div>
        </header>
        <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            {isLoading ? (
                 <div className="flex justify-center items-center py-16">
                    <SpinnerIcon className="h-8 w-8 text-indigo-600" />
                    <span className="ml-4 text-gray-600">Loading your resumes...</span>
                 </div>
            ) : resumes.length === 0 ? (
                <div className="text-center py-16 px-4 border-2 border-dashed border-gray-300 rounded-lg">
                    <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No resumes saved</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating and saving a new resume.</p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {resumes.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).map(resume => (
                        <li key={resume.id} className="bg-white p-4 shadow rounded-lg flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-indigo-700">{resume.name}</p>
                                <p className="text-sm text-gray-500">Last updated: {new Date(resume.updated_at).toLocaleString()}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => onLoad(resume)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">Load</button>
                                <button onClick={() => onDelete(resume.id)} className="text-red-500 hover:text-red-700">
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </main>
    </div>
  );
};
