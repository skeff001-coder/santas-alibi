import type { AudioSource } from 'expo-audio';

export type Scenario = {
  id: string;
  title: string;
  blurb: string;
  emoji: string;
  pro: boolean;
  asset: AudioSource;
  /** Must match the filename listed in app.json -> expo-notifications -> sounds */
  file: string;
  durationMs: number;
  notifTitle: string;
  notifBody: string;
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'classic',
    title: 'The Classic Visit',
    blurb: 'Soft footsteps, a thud in the chimney, then sleigh bells.',
    emoji: '🎅',
    pro: false,
    asset: require('../assets/sounds/classic.wav'),
    file: 'classic.wav',
    durationMs: 9600,
    notifTitle: '👂 Did you hear that?',
    notifBody: 'Something is moving downstairs...',
  },
  {
    id: 'pie',
    title: 'Mince Pie Midnight',
    blurb: 'A creaking door, crunching, a happy clink of the glass.',
    emoji: '🥧',
    pro: true,
    asset: require('../assets/sounds/pie.wav'),
    file: 'pie.wav',
    durationMs: 13300,
    notifTitle: '🥧 Someone is hungry',
    notifBody: 'Is that crunching coming from the living room?',
  },
  {
    id: 'rudolph',
    title: "Rudolph's Cold",
    blurb: 'Hooves on the roof, a snort, then a mighty sneeze.',
    emoji: '🦌',
    pro: true,
    asset: require('../assets/sounds/rudolph.wav'),
    file: 'rudolph.wav',
    durationMs: 10500,
    notifTitle: '🦌 Hooves on the roof!',
    notifBody: 'Listen carefully...',
  },
  {
    id: 'chaos',
    title: 'Chimney Chaos',
    blurb: 'A rough landing, a cough, a scramble and a quick escape.',
    emoji: '🧯',
    pro: true,
    asset: require('../assets/sounds/chaos.wav'),
    file: 'chaos.wav',
    durationMs: 12900,
    notifTitle: '💥 What was THAT?',
    notifBody: 'It came from the chimney...',
  },
];

export const DELAYS = [
  { label: '5 sec', sub: 'test', seconds: 5 },
  { label: '10 min', sub: '', seconds: 10 * 60 },
  { label: '30 min', sub: '', seconds: 30 * 60 },
  { label: '1 hr', sub: '', seconds: 60 * 60 },
  { label: '2 hr', sub: '', seconds: 2 * 60 * 60 },
];
