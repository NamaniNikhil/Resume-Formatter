
import React from 'react';
import { ResumeData, Experience, Education, Skill } from '../../types';
import { EditableField, EditableList } from './EditableField';

interface PreviewProps {
  data: ResumeData;
  onUpdate: (newData: ResumeData) => void;
}

export const ClassicPreview: React.FC<PreviewProps> = ({ data, onUpdate }) => {
  
  const handleUpdate = (field: keyof ResumeData, value: any) => {
    onUpdate({ ...data, [field]: value });
  };
  
  const handleNestedUpdate = (section: 'contact', key: keyof ResumeData['contact'], value: string) => {
    onUpdate({ ...data, [section]: { ...data[section], [key]: value } });
  };

  const handleArrayUpdate = (
    section: 'experience' | 'education' | 'skills',
    index: number,
    field: keyof Experience | keyof Education | keyof Skill,
    value: any
  ) => {
    const newArray = [...data[section]];
    // @ts-ignore
    newArray[index] = { ...newArray[index], [field]: value };
    onUpdate({ ...data, [section]: newArray });
  };

  return (
    <div className="bg-white p-8 text-black font-[Calibri] text-[11pt] leading-normal">
      <div className="text-center">
        <EditableField 
            value={data.name} 
            onChange={v => handleUpdate('name', v)}
            className="text-3xl font-bold tracking-wider uppercase text-center"
            isTextarea={false}
        />
        <div className="text-xs mt-2">
           <EditableField value={data.contact.location} onChange={v => handleNestedUpdate('contact', 'location', v)} isTextarea={false} className="inline-block" /> | 
           <EditableField value={data.contact.phone} onChange={v => handleNestedUpdate('contact', 'phone', v)} isTextarea={false} className="inline-block" /> |
           <EditableField value={data.contact.email} onChange={v => handleNestedUpdate('contact', 'email', v)} isTextarea={false} className="inline-block" />
        </div>
      </div>

      <Section title="Professional Summary">
        <EditableField value={data.summary} onChange={v => handleUpdate('summary', v)} />
      </Section>
      
      <Section title="Skills">
        {data.skills.map((skill, index) => (
          <p key={index}>
            <EditableField value={skill.category} onChange={v => handleArrayUpdate('skills', index, 'category', v)} className="font-bold inline-block" isTextarea={false} />: 
            <EditableField value={skill.details} onChange={v => handleArrayUpdate('skills', index, 'details', v)} className="inline-block" isTextarea={false} />
          </p>
        ))}
      </Section>

      <Section title="Professional Experience">
        {data.experience.map((exp, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="text-base">
                <EditableField value={exp.jobTitle} onChange={v => handleArrayUpdate('experience', index, 'jobTitle', v)} className="font-bold inline-block" isTextarea={false} />
                <span> | </span>
                <EditableField value={exp.company} onChange={v => handleArrayUpdate('experience', index, 'company', v)} className="inline-block" isTextarea={false} />
              </h3>
               <EditableField value={exp.dates} onChange={v => handleArrayUpdate('experience', index, 'dates', v)} className="font-bold text-base text-right" isTextarea={false} />
            </div>
            
            <EditableList
                items={exp.description}
                onChange={newList => handleArrayUpdate('experience', index, 'description', newList)}
                className="list-disc list-inside mt-1 pl-4 space-y-1"
            />
          </div>
        ))}
      </section>

      <Section title="Education">
        {data.education.map((edu, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between items-baseline">
              <EditableField value={edu.institution} onChange={v => handleArrayUpdate('education', index, 'institution', v)} className="font-bold text-base" isTextarea={false} />
              <EditableField value={edu.dates} onChange={v => handleArrayUpdate('education', index, 'dates', v)} className="font-bold text-sm text-right" isTextarea={false} />
            </div>
             <EditableField value={`${edu.degree}${edu.gpa ? `, GPA: ${edu.gpa}` : ''}`} onChange={v => handleArrayUpdate('education', index, 'degree', v)} className="italic" isTextarea={false} />
          </div>
        ))}
      </section>

      {data.certifications && data.certifications.length > 0 && (
         <Section title="Certifications">
            <EditableList items={data.certifications} onChange={v => handleUpdate('certifications', v)} />
        </Section>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mt-5">
    <h2 className="text-lg font-bold border-b-2 border-black pb-1 uppercase tracking-wider">{title}</h2>
    <div className="mt-2">{children}</div>
  </div>
);
