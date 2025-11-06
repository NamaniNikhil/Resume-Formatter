import * as docx from 'docx';
import { ResumeData, Template, Experience, Education, Skill } from '../types';

const FONT_FAMILY = 'Calibri';
const FONT_SIZE_BODY = 22; // 11pt
const FONT_SIZE_NAME = 40; // 20pt
const FONT_SIZE_SUBHEADING = 24; // 12pt
const SECTION_SPACING = { before: 200, after: 100 };

// --- Classic Template Generation ---
const createClassicDoc = (data: ResumeData): docx.Document => {
  return new docx.Document({
    sections: [{
      properties: {
        page: {
            size: {
                width: 11906, // A4 width in DXA
                height: 16838, // A4 height in DXA
            },
            margin: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720,
            },
        },
      },
      children: [
        new docx.Paragraph({
          children: [new docx.TextRun({ text: data.name.toUpperCase(), bold: true, size: FONT_SIZE_NAME, font: FONT_FAMILY })],
          alignment: docx.AlignmentType.CENTER,
        }),
        new docx.Paragraph({
          text: `${data.contact.location} | ${data.contact.phone} | ${data.contact.email}`,
          alignment: docx.AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        createSectionTitle('Professional Summary'),
        new docx.Paragraph({ children: [new docx.TextRun({ text: data.summary, size: FONT_SIZE_BODY, font: FONT_FAMILY })] }),
        createSectionTitle('Skills'),
        ...data.skills.map(skill => createSkillItem(skill)),
        createSectionTitle('Professional Experience'),
        ...data.experience.flatMap(exp => createClassicExperience(exp)),
        createSectionTitle('Education'),
        ...data.education.flatMap(edu => createClassicEducation(edu)),
        ...(data.certifications && data.certifications.length > 0
          ? [createSectionTitle('Certifications'), new docx.Paragraph({ text: data.certifications.join(' | '), style: "Body" })]
          : []),
      ],
    }],
    styles: {
      paragraphStyles: [{
        id: "Body",
        name: "Body",
        basedOn: "Normal",
        next: "Normal",
        run: { size: FONT_SIZE_BODY, font: FONT_FAMILY },
      }],
    }
  });
};

const createSectionTitle = (text: string) => new docx.Paragraph({
  children: [new docx.TextRun({ text, bold: true, size: FONT_SIZE_SUBHEADING, font: FONT_FAMILY })],
  border: { bottom: { color: "auto", space: 1, value: docx.BorderStyle.SINGLE, size: 6 } },
  spacing: SECTION_SPACING,
});

const createClassicExperience = (exp: Experience) => {
    // Using tabStops for proper right alignment
    const headerParagraph = new docx.Paragraph({
        tabStops: [
            {
                type: docx.TabStopType.RIGHT,
                position: docx.TabStopPosition.MAX, // Right edge of page
            },
        ],
        children: [
            new docx.TextRun({ text: exp.jobTitle, bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
            new docx.TextRun({ text: ` | ${exp.company}`, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
            new docx.TextRun({ text: '\t', size: FONT_SIZE_BODY, font: FONT_FAMILY }), // Tab character
            new docx.TextRun({ text: exp.dates, bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
        ],
    });

    return [
        headerParagraph,
        ...exp.description.map(desc => new docx.Paragraph({
            text: desc,
            bullet: { level: 0 },
            style: "Body",
            indent: { left: 360, hanging: 360 },
        })),
        new docx.Paragraph({ spacing: { after: 200 } }), // Spacer
    ];
};

const createClassicEducation = (edu: Education) => {
    // Using tabStops for proper right alignment
    const headerParagraph = new docx.Paragraph({
        tabStops: [
            {
                type: docx.TabStopType.RIGHT,
                position: docx.TabStopPosition.MAX, // Right edge of page
            },
        ],
        children: [
            new docx.TextRun({ text: edu.institution, bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
            new docx.TextRun({ text: '\t', size: FONT_SIZE_BODY, font: FONT_FAMILY }), // Tab character
            new docx.TextRun({ text: edu.dates, bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
        ],
    });
    
    const degreeLine = new docx.Paragraph({
        children: [
             new docx.TextRun({ text: `${edu.degree}${edu.gpa ? `, GPA: ${edu.gpa}` : ''}`, italics: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
        ]
    });

    return [headerParagraph, degreeLine];
};


const createSkillItem = (skill: Skill) => new docx.Paragraph({
    children: [
        new docx.TextRun({ text: `${skill.category}: `, bold: true, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
        new docx.TextRun({ text: skill.details, size: FONT_SIZE_BODY, font: FONT_FAMILY }),
    ],
    spacing: { after: 50 }
});


// --- Modern Template Generation ---
const createModernDoc = (data: ResumeData): docx.Document => {
  const FONT_MODERN = 'Arial';

  const doc = new docx.Document({
    sections: [{
      children: [
        new docx.Paragraph({ text: data.name, heading: docx.HeadingLevel.HEADING_1 }),
        new docx.Paragraph({ text: data.experience[0]?.jobTitle || 'Professional', heading: docx.HeadingLevel.HEADING_3, style: "Heading3" }),
        new docx.Table({
          width: { size: 100, type: docx.WidthType.PERCENTAGE },
          borders: { insideHorizontal: { style: docx.BorderStyle.NONE }, insideVertical: { style: docx.BorderStyle.NONE }, top: { style: docx.BorderStyle.NONE }, bottom: { style: docx.BorderStyle.NONE }, left: { style: docx.BorderStyle.NONE }, right: { style: docx.BorderStyle.NONE } },
          rows: [
            new docx.TableRow({
              children: [
                new docx.TableCell({
                  width: { size: 33, type: docx.WidthType.PERCENTAGE },
                  verticalAlign: docx.VerticalAlign.TOP,
                  children: [
                    createModernSectionTitle('Contact'),
                    new docx.Paragraph(data.contact.email),
                    new docx.Paragraph(data.contact.phone),
                    new docx.Paragraph(data.contact.location),
                    ...(data.contact.linkedin ? [new docx.Paragraph(data.contact.linkedin)] : []),
                    ...(data.contact.portfolio ? [new docx.Paragraph(data.contact.portfolio)] : []),

                    createModernSectionTitle('Skills'),
                    ...data.skills.flatMap(skill => [
                        new docx.Paragraph({ children: [new docx.TextRun({ text: skill.category, bold: true })] }),
                        new docx.Paragraph(skill.details)
                    ]),

                    createModernSectionTitle('Education'),
                    ...data.education.map(edu => new docx.Paragraph(`${edu.institution}\n${edu.degree}\n${edu.dates}`)),

                    ...(data.certifications && data.certifications.length > 0 ? [
                       createModernSectionTitle('Certifications'),
                      ...data.certifications.map(cert => new docx.Paragraph({ text: cert, bullet: { level: 0 } }))
                    ] : [])
                  ]
                }),
                new docx.TableCell({
                  width: { size: 67, type: docx.WidthType.PERCENTAGE },
                  verticalAlign: docx.VerticalAlign.TOP,
                  children: [
                    createModernSectionTitle('Summary'),
                    new docx.Paragraph(data.summary),

                    createModernSectionTitle('Experience'),
                    ...data.experience.flatMap(exp => createModernExperience(exp)),
                  ]
                }),
              ],
            }),
          ],
        }),
      ],
    }],
    styles: {
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", run: { size: 60, bold: true, font: FONT_MODERN } },
        { id: "Heading3", name: "Heading 3", run: { size: 28, color: "5B21B6", font: FONT_MODERN }, spacing: { after: 200 } },
        { id: "ModernSection", name: "Modern Section", run: { size: 24, bold: true, color: "5B21B6", font: FONT_MODERN }, border: { bottom: { color: "auto", size: 4, value: docx.BorderStyle.SINGLE } }, spacing: { after: 100, before: 300 } },
      ],
    },
  });

  return doc;
};

const createModernSectionTitle = (title: string) => new docx.Paragraph({ text: title.toUpperCase(), style: 'ModernSection' });

const createModernExperience = (exp: Experience) => [
  new docx.Paragraph({
    tabStops: [
        {
            type: docx.TabStopType.RIGHT,
            position: 9000, // Adjust based on table cell width (67% of page)
        },
    ],
    children: [
      new docx.TextRun({ text: exp.jobTitle, bold: true, size: 22, font: 'Arial' }),
      new docx.TextRun({ text: '\t', size: 20, font: 'Arial' }), // Tab character
      new docx.TextRun({ text: exp.dates, size: 20, font: 'Arial' }),
    ],
  }),
  new docx.Paragraph({
    children: [new docx.TextRun({ text: exp.company, bold: true, color: "4C1D95", size: 20, font: 'Arial' })],
    spacing: { after: 50 },
  }),
  ...exp.description.map(desc => new docx.Paragraph({ text: desc, bullet: { level: 0 } })),
  new docx.Paragraph(""), // Spacer
];

// --- Main Export ---
export const generateDocx = async (data: ResumeData, template: Template): Promise<Blob> => {
  let doc: docx.Document;

  switch (template) {
    case Template.CLASSIC:
      doc = createClassicDoc(data);
      break;
    case Template.MODERN:
      doc = createModernDoc(data);
      break;
    default:
      doc = createClassicDoc(data);
  }

  return await docx.Packer.toBlob(doc);
};