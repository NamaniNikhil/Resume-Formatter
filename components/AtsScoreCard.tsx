
import React, { useState } from 'react';
import { AtsAnalysis } from '../types';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';

interface AtsScoreCardProps {
  analysis: AtsAnalysis;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  return 'text-red-500';
};

export const AtsScoreCard: React.FC<AtsScoreCardProps> = ({ analysis }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const scoreColor = getScoreColor(analysis.score);

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 transition-all duration-300">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center">
                    <div className={`text-4xl font-bold ${scoreColor}`}>{analysis.score}</div>
                    <div className="ml-3">
                        <h3 className="text-lg font-semibold text-gray-800">ATS Health Score</h3>
                        <p className="text-sm text-gray-500">How well your resume scores against applicant tracking systems.</p>
                    </div>
                </div>
                <ChevronDownIcon className={`h-6 w-6 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2"><LightBulbIcon className="h-5 w-5 text-yellow-500" /> Suggestions for Improvement</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {analysis.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                        ))}
                    </ul>
                    
                    {(analysis.keywords?.matched?.length > 0 || analysis.keywords?.missing?.length > 0) && (
                        <div className="mt-4">
                             <h4 className="font-semibold text-gray-700 mb-2">Keyword Analysis</h4>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h5 className="font-medium text-green-600 flex items-center gap-1.5"><CheckCircleIcon className="h-5 w-5"/> Matched Keywords</h5>
                                    <p className="text-gray-500 mt-1">{analysis.keywords.matched.join(', ') || 'None'}</p>
                                </div>
                                <div>
                                    <h5 className="font-medium text-red-600 flex items-center gap-1.5"><XCircleIcon className="h-5 w-5"/> Missing Keywords</h5>
                                    <p className="text-gray-500 mt-1">{analysis.keywords.missing.join(', ') || 'None'}</p>
                                </div>
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
