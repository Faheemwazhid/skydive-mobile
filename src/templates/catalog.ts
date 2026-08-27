import type { Template } from '@/src/domain/template';

export const templates: Template[] = [
  {
    id: 'chief-of-staff',
    name: 'Chief of Staff',
    characterId: 'dot',
    blurb: 'Runs the calendar, the inbox, and the follow-ups.',
    worksWith: ['Google Calendar', 'Gmail', 'Slack'],
    whatYouGet: [
      'Daily briefing',
      'Meeting prep',
      'Follow-up drafts',
    ],
  },
  {
    id: 'engineer',
    name: 'Engineer',
    characterId: 'moss',
    blurb: 'Owns the path from intent to a verified handoff.',
    worksWith: ['GitHub', 'Linear'],
    whatYouGet: ['PR reviews', 'Incident notes', 'Ship checklists'],
  },
  {
    id: 'designer',
    name: 'Designer',
    characterId: 'cleo',
    blurb: 'Turns messy briefs into clear product surfaces.',
    worksWith: ['Figma', 'Slack'],
    whatYouGet: ['Critique notes', 'Spec polish', 'Handoff checklists'],
  },
  {
    id: 'legal',
    name: 'Legal',
    characterId: 'river',
    blurb: 'Reads the contract so you do not have to.',
    worksWith: ['Google Drive', 'Gmail'],
    whatYouGet: ['Redlines', 'Obligation lists', 'Date extraction'],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    characterId: 'poppy',
    blurb: 'Keeps the story consistent across every channel.',
    worksWith: ['Notion', 'Slack'],
    whatYouGet: ['Campaign drafts', 'Launch checklists'],
  },
  {
    id: 'ops',
    name: 'Ops',
    characterId: 'sol',
    blurb: 'Closes the loop on recurring operational work.',
    worksWith: ['Linear', 'Slack'],
    whatYouGet: ['Runbooks', 'Status rollups'],
  },
  {
    id: 'support',
    name: 'Customer Service',
    characterId: 'sky',
    blurb: 'Answers with the same memory the rest of your agents have.',
    worksWith: ['Gmail', 'Slack'],
    whatYouGet: ['Draft replies', 'Escalation notes'],
  },
];

export function getTemplate(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
