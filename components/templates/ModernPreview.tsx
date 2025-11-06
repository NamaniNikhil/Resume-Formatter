
import React from 'react';
import { ResumeData, Experience, Education, Skill } from '../../types';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, GlobeAltIcon, LinkIcon } from '../icons/ContactIcons';
import { EditableField, EditableList } from './EditableField';

interface PreviewProps {
  data: ResumeData;
  onUpdate: (newData: ResumeData) => void;
}

export const ModernPreview: React.FC<PreviewProps> = ({ data, onUpdate }) => {
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
    <div className="bg-white p-6 text-black font-[Arial] text-[10pt] leading-snug">
      <div className="text-left mb-6 pb-4 border-b-2 border-gray-200">
        <EditableField value={data.name} onChange={v => handleUpdate('name', v)} className="text-4xl font-extrabold text-gray-800" isTextarea={false} />
        <EditableField value={data.experience[0]?.jobTitle || 'Professional'} onChange={v => handleArrayUpdate('experience', 0, 'jobTitle', v)} className="text-lg text-indigo-600 font-semibold mt-1" isTextarea={false} />
      </div>
      
      <div className="grid grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="col-span-1 pr-6 border-r border-gray-200">
          <Section title="Contact">
             <ContactItem icon={<EnvelopeIcon />} text={<EditableField isTextarea={false} value={data.contact.email} onChange={v => handleNestedUpdate('contact', 'email', v)} />} />
             <ContactItem icon={<PhoneIcon />} text={<EditableField isTextarea={false} value={data.contact.phone} onChange={v => handleNestedUpdate('contact', 'phone', v)} />} />
             <ContactItem icon={<MapPinIcon />} text={<EditableField isTextarea={false} value={data.contact.location} onChange={v => handleNestedUpdate('contact', 'location', v)} />} />
             {data.contact.linkedin && <ContactItem icon={<LinkIcon />} text={<EditableField isTextarea={false} value={data.contact.linkedin} onChange={v => handleNestedUpdate('contact', 'linkedin', v)} />} />}
             {data.contact.portfolio && <ContactItem icon={<GlobeAltIcon />} text={<EditableField isTextarea={false} value={data.contact.portfolio} onChange={v => handleNestedUpdate('contact', 'portfolio', v)} />} />}
          </Section>
          
          <Section title="Skills">
            <div className="space-y-2">
              {data.skills.map((skill, i) => 
                <div key={i}>
                    <EditableField value={skill.category} onChange={v => handleArrayUpdate('skills', i, 'category', v)} className="font-semibold" isTextarea={false} />
                    <EditableField value={skill.details} onChange={v => handleArrayUpdate('skills', i, 'details', v)} className="text-sm text-gray-600 pl-2" />
                </div>
              )}
            </div>
          </Section>

          <Section title="Education">
            {data.education.map((edu, index) => (
              <div key={index} className="mb-3">
                <EditableField value={edu.institution} onChange={v => handleArrayUpdate('education', index, 'institution', v)} className="font-bold" isTextarea={false} />
                <EditableField value={edu.degree} onChange={v => handleArrayUpdate('education', index, 'degree', v)} />
                <EditableField value={edu.dates} onChange={v => handleArrayUpdate('education', index, 'dates', v)} className="text-gray-600 text-sm" isTextarea={false} />
              </div>
            ))}
          </Section>

          {data.certifications && data.certifications.length > 0 && (
            <Section title="Certifications">
              <EditableList items={data.certifications} onChange={v => handleUpdate('certifications', v)} className="list-disc list-inside space-y-1" />
            </Section>
          )}
        </div>

        {/* Right Column */}
        <div className="col-span-2">
           <Section title="Summary">
            <EditableField value={data.summary} onChange={v => handleUpdate('summary', v)} />
          </Section>

          <Section title="Experience">
            {data.experience.map((exp, index) => (
              <div key={index} className="mb-4">
                <div className="flex justify-between items-baseline">
                   <EditableField value={exp.jobTitle} onChange={v => handleArrayUpdate('experience', index, 'jobTitle', v)} className="font-bold text-base" isTextarea={false} />
                   <EditableField value={exp.dates} onChange={v => handleArrayUpdate('experience', index, 'dates', v)} className="text-sm font-medium text-gray-600" isTextarea={false} />
                </div>
                <EditableField value={exp.company} onChange={v => handleArrayUpdate('experience', index, 'company', v)} className="font-semibold text-indigo-700" isTextarea={false} />
                <EditableList
                  items={exp.description}
                  onChange={newList => handleArrayUpdate('experience', index, 'description', newList)}
                  className="list-disc list-inside mt-1 pl-4 space-y-1 text-gray-700"
                />
              </div>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-6">
    <h2 className="text-lg font-bold text-indigo-600 border-b border-indigo-200 pb-1 mb-2 uppercase tracking-wider">{title}</h2>
    <div className="text-gray-800">{children}</div>
  </div>
);

const ContactItem: React.FC<{icon: React.ReactNode, text: React.ReactNode}> = ({icon, text}) => (
    <div className="flex items-start text-sm text-gray-700 mb-1.5">
        <span className="text-indigo-500 mr-2 mt-1 flex-shrink-0">{icon}</span>
        <span className="flex-grow">{text}</span>
    </div>
)
