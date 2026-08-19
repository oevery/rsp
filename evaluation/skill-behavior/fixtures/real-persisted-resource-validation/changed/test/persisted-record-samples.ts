export const persistedRecordSamples = [
  { id: 'malformed', state: 'ready', url: 'not a URL' },
  { id: 'local-file', state: 'ready', url: 'file:///private/tmp/track.mp3' },
  { id: 'credential-bearing', state: 'ready', url: 'https://reader:secret@media.example.invalid/private.mp3' },
  { id: 'public-track', state: 'ready', url: 'https://media.example.invalid/tracks/public.mp3' },
] as const
