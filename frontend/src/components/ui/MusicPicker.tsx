import React, { useState, useEffect, useRef } from 'react';
import { Search, Music, Play, Pause, Check, Volume2, VolumeX, X } from 'lucide-react';
import { AudioTrack, ROYALTY_FREE_TRACKS, searchTracks } from '../../lib/musicLibrary';
import { Input } from './Input';
import { Button } from './Button';

interface MusicPickerProps {
  onSelectTrack: (track: AudioTrack, startTime: number) => void;
  onClose: () => void;
}

export const MusicPicker: React.FC<MusicPickerProps> = ({ onSelectTrack, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<AudioTrack[]>(ROYALTY_FREE_TRACKS);
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  
  // Audio playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(0); // in seconds
  const [currentTime, setCurrentTime] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playheadIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setTracks(searchTracks(searchQuery));
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  const selectTrack = (track: AudioTrack) => {
    stopAudio();
    setSelectedTrack(track);
    setStartTime(0);
    setCurrentTime(0);
    setIsPlaying(false);

    if (audioRef.current) {
      audioRef.current.src = track.audio_url;
      audioRef.current.load();
    } else {
      const audio = new Audio(track.audio_url);
      audioRef.current = audio;
    }
  };

  const startAudio = () => {
    if (!audioRef.current || !selectedTrack) return;

    audioRef.current.currentTime = startTime;
    audioRef.current.play()
      .then(() => {
        setIsPlaying(true);
        startPlayheadTimer();
      })
      .catch((err) => console.error('Play audio failed:', err));
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    stopPlayheadTimer();
  };

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const startPlayheadTimer = () => {
    stopPlayheadTimer();
    playheadIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        const curr = audioRef.current.currentTime;
        setCurrentTime(curr);

        // Cap at 15 seconds segment for stories
        if (curr >= startTime + 15) {
          audioRef.current.currentTime = startTime;
          setCurrentTime(startTime);
        }
      }
    }, 100);
  };

  const stopPlayheadTimer = () => {
    if (playheadIntervalRef.current) {
      clearInterval(playheadIntervalRef.current);
      playheadIntervalRef.current = null;
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setStartTime(time);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // Find the active lyric line based on currentTime
  const getActiveLyric = () => {
    if (!selectedTrack || !selectedTrack.lyrics) return '';
    const active = [...selectedTrack.lyrics]
      .reverse()
      .find((lyric) => currentTime >= startTime + lyric.time);
    return active ? active.text : '...';
  };

  const handleConfirmSelection = () => {
    if (selectedTrack) {
      onSelectTrack(selectedTrack, startTime);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white rounded-t-2xl border-t border-zinc-800">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-zinc-900">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Music className="w-5 h-5 text-indigo-400" /> Choose Music
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs or artists..."
            className="pl-9 bg-zinc-900 border-zinc-800 text-sm focus:ring-indigo-500"
          />
        </div>

        {/* Selected Track Editor */}
        {selectedTrack && (
          <div className="p-4 bg-zinc-900/60 border border-zinc-800/80 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <img src={selectedTrack.cover_url} alt="Cover" className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{selectedTrack.title}</p>
                <p className="text-xs text-zinc-400 truncate">{selectedTrack.artist}</p>
              </div>
              <button 
                onClick={togglePlay}
                className="p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full text-white transition active:scale-95"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>

            {/* Scrolling Waveform/Slider editor */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>Start: {startTime.toFixed(1)}s</span>
                <span>Segment Length: 15s</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(0, selectedTrack.duration_seconds - 15)}
                step="0.5"
                value={startTime}
                onChange={handleSliderChange}
                className="w-full accent-indigo-500 h-1.5 bg-zinc-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Dynamic Lyrics display */}
            <div className="p-3 bg-black/40 border border-zinc-800/50 rounded-lg text-center h-16 flex items-center justify-center">
              <p className="text-sm italic font-medium text-pink-400 animate-pulse truncate">
                {getActiveLyric()}
              </p>
            </div>

            {/* Attach button */}
            <Button onClick={handleConfirmSelection} className="w-full bg-indigo-600 hover:bg-indigo-500 text-sm">
              Attach to Story
            </Button>
          </div>
        )}

        {/* Track List */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider px-1">All Songs</p>
          {tracks.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-6">No tracks found</p>
          ) : (
            tracks.map((track) => (
              <div 
                key={track.id}
                onClick={() => selectTrack(track)}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
                  selectedTrack?.id === track.id ? 'bg-zinc-900 border border-indigo-500/30' : 'hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                <img src={track.cover_url} alt="Cover" className="w-10 h-10 rounded-md object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{track.title}</p>
                  <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
                </div>
                {selectedTrack?.id === track.id && (
                  <Check className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
