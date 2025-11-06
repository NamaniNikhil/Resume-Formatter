
import React from 'react';
import { Template } from '../types';

interface TemplateSelectorProps {
  selected: Template;
  onSelect: (template: Template) => void;
}

const templates = [
  { id: Template.CLASSIC, name: 'Classic', description: 'A timeless, single-column ATS-friendly format.' },
  { id: Template.MODERN, name: 'Modern', description: 'A stylish two-column layout to highlight skills.' },
];

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div>
      <label className="text-base font-medium text-gray-900">Select a Template</label>
      <fieldset className="mt-4">
        <legend className="sr-only">Template selection</legend>
        <div className="space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-4">
          {templates.map((template) => (
            <div key={template.id} className="flex items-center w-full">
              <input
                id={template.id}
                name="template-selection"
                type="radio"
                checked={selected === template.id}
                onChange={() => onSelect(template.id)}
                className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300"
              />
              <label htmlFor={template.id} className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
                {template.name}
                 <p className="text-xs text-gray-500">{template.description}</p>
              </label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
};
