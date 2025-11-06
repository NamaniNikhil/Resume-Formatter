
import React, { useState, useRef, useEffect } from 'react';
import { TrashIcon } from '../icons/TrashIcon';

interface EditableFieldProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  isTextarea?: boolean;
}

export const EditableField: React.FC<EditableFieldProps> = ({ value, onChange, className = '', isTextarea = true }) => {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };
  
  const handleBlur = () => {
    // Optional: could add save logic here if needed
  };

  const commonProps = {
    ref: inputRef as any,
    value: value,
    onChange: handleChange,
    onBlur: handleBlur,
    className: `w-full bg-transparent focus:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-indigo-300 rounded p-1 -m-1 ${className}`,
  };

  return isTextarea ? (
    <textarea {...commonProps} rows={3} />
  ) : (
    <input type="text" {...commonProps} />
  );
};


interface EditableListProps {
  items: string[];
  onChange: (newItems: string[]) => void;
  className?: string;
}

export const EditableList: React.FC<EditableListProps> = ({ items, onChange, className }) => {
    
    const handleItemChange = (index: number, newValue: string) => {
        const newItems = [...items];
        newItems[index] = newValue;
        onChange(newItems);
    };

    const handleItemDelete = (index: number) => {
        const newItems = items.filter((_, i) => i !== index);
        onChange(newItems);
    };
    
  return (
    <ul className={className}>
      {items.map((item, index) => (
        <li key={index} className="flex items-start group">
          <span className="mr-2 mt-1">&#8226;</span>
          <div className="flex-grow">
            <EditableField 
                value={item} 
                onChange={(v) => handleItemChange(index, v)}
                isTextarea={false}
            />
          </div>
          <button onClick={() => handleItemDelete(index)} className="ml-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
              <TrashIcon className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
};
