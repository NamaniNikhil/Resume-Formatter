/**
 * INLINE EDITING COMPONENTS
 * 
 * These components enable users to edit the parsed resume data directly in the
 * preview panel. Changes propagate immediately to the App state via callbacks,
 * allowing users to refine AI-parsed content before exporting.
 * 
 * Key features:
 * - Transparent until focused (seamless editing experience)
 * - Immediate updates on every keystroke (no "save" button needed)
 * - Support for both single-line and multi-line fields
 * - List items can be individually deleted
 */
import React, { useState, useRef, useEffect } from 'react';
import { TrashIcon } from '../icons/TrashIcon';

interface EditableFieldProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  isTextarea?: boolean;
}

/**
 * EDITABLE FIELD COMPONENT
 * 
 * Renders an inline-editable text field that appears as regular text until clicked.
 * On focus, shows a light blue background and border to indicate editability.
 * Changes are immediately propagated to parent components via the onChange callback.
 * 
 * Used throughout the preview templates for all text content (name, contact, summary,
 * experience details, education, etc.)
 */
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

/**
 * EDITABLE LIST COMPONENT
 * 
 * Manages arrays of strings (e.g., experience bullet points, certifications).
 * Each item is individually editable and can be deleted via a hover button.
 * 
 * This component is essential for the experience section where users may want
 * to add, edit, or remove individual achievement bullets.
 */
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
