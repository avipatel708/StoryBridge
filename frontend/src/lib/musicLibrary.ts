export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string;
  duration_seconds: number;
  lyrics: { time: number; text: string }[];
}

export const ROYALTY_FREE_TRACKS: AudioTrack[] = [
  {
    id: 'lofi-sunset',
    title: 'Lofi Sunset',
    artist: 'Chill Beats',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover_url: 'https://images.unsplash.com/photo-1518173946687-a4c8a383392e?w=150&h=150&fit=crop',
    duration_seconds: 30,
    lyrics: [
      { time: 0, text: 'As the sun sets down...' },
      { time: 5, text: 'We feel the warm breeze around...' },
      { time: 10, text: 'Lofi vibes inside our soul...' },
      { time: 15, text: 'Letting go of all control...' }
    ]
  },
  {
    id: 'synthwave-drive',
    title: 'Synthwave Drive',
    artist: 'Retro Wave',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover_url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=150&h=150&fit=crop',
    duration_seconds: 30,
    lyrics: [
      { time: 0, text: 'Cruising down the neon street' },
      { time: 6, text: 'Synth beats moving to our feet' },
      { time: 12, text: 'Eighties dreams under the light' },
      { time: 18, text: 'We will ride into the night' }
    ]
  },
  {
    id: 'acoustic-breeze',
    title: 'Acoustic Breeze',
    artist: 'Summer Folk',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&h=150&fit=crop',
    duration_seconds: 30,
    lyrics: [
      { time: 0, text: 'Strings of silver, strings of gold' },
      { time: 5, text: 'Warmest stories ever told' },
      { time: 11, text: 'Walk with me along the sand' },
      { time: 17, text: 'Take my heart and take my hand' }
    ]
  },
  {
    id: 'electric-dream',
    title: 'Electric Dream',
    artist: 'Future Neon',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&h=150&fit=crop',
    duration_seconds: 30,
    lyrics: [
      { time: 0, text: 'Sparking up a neon fire' },
      { time: 5, text: 'Higher than our pure desire' },
      { time: 11, text: 'Electric waves through the space' },
      { time: 16, text: 'Lost inside this glowing place' }
    ]
  },
  {
    id: 'summer-hop',
    title: 'Summer Hop',
    artist: 'Groove City',
    audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&h=150&fit=crop',
    duration_seconds: 30,
    lyrics: [
      { time: 0, text: 'Jump up, let the sunshine in' },
      { time: 5, text: 'This is where the fun begins' },
      { time: 10, text: 'Clapping hands and moving feet' },
      { time: 16, text: 'Walking down the sunny street' }
    ]
  }
];

export const searchTracks = (query: string): AudioTrack[] => {
  const q = query.toLowerCase().trim();
  if (!q) return ROYALTY_FREE_TRACKS;
  return ROYALTY_FREE_TRACKS.filter(
    track =>
      track.title.toLowerCase().includes(q) ||
      track.artist.toLowerCase().includes(q)
  );
};
