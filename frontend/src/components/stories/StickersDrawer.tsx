import React, { useState } from 'react';
import { 
  X, MapPin, Hash, User, BarChart2, HelpCircle, Calendar, 
  Link, Image, Sun, Music, Compass, Smile 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface StickersDrawerProps {
  onAddSticker: (sticker: any) => void;
  onClose: () => void;
}

type StickerType = 
  | 'menu' 
  | 'location' 
  | 'hashtag' 
  | 'mention' 
  | 'poll' 
  | 'quiz' 
  | 'countdown' 
  | 'link' 
  | 'weather' 
  | 'music';

export const StickersDrawer: React.FC<StickersDrawerProps> = ({ onAddSticker, onClose }) => {
  const [activeTab, setActiveTab] = useState<StickerType>('menu');

  // Input states for sticker customization
  const [locationName, setLocationName] = useState('');
  const [hashtagText, setHashtagText] = useState('');
  const [mentionUser, setMentionUser] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['Yes', 'No']);
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizOptions, setQuizOptions] = useState(['', '', '']);
  const [quizCorrect, setQuizCorrect] = useState<number>(0);
  const [countdownTitle, setCountdownTitle] = useState('');
  const [countdownDate, setCountdownDate] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [weatherTemp, setWeatherTemp] = useState('72');
  const [weatherIcon, setWeatherIcon] = useState('☀️');

  const handleCreateSticker = (type: string, data: any) => {
    onAddSticker({
      id: `${type}-${Date.now()}`,
      type,
      x: 150, // default center coordinates
      y: 300,
      scale: 1,
      rotation: 0,
      data
    });
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-white rounded-t-2xl border-t border-zinc-800 select-none">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-zinc-900">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Smile className="w-5 h-5 text-pink-400" /> Story Stickers
        </h3>
        <button onClick={onClose} className="p-1.5 hover:bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'menu' && (
          <div className="grid grid-cols-3 gap-3">
            {/* Grid menu of stickers */}
            <button 
              onClick={() => setActiveTab('location')}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition"
            >
              <MapPin className="w-6 h-6 text-red-400" />
              <span className="text-xs font-semibold">Location</span>
            </button>

            <button 
              onClick={() => setActiveTab('mention')}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition"
            >
              <User className="w-6 h-6 text-blue-400" />
              <span className="text-xs font-semibold">Mention</span>
            </button>

            <button 
              onClick={() => setActiveTab('hashtag')}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition"
            >
              <Hash className="w-6 h-6 text-orange-400" />
              <span className="text-xs font-semibold">Hashtag</span>
            </button>

            <button 
              onClick={() => setActiveTab('poll')}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition"
            >
              <BarChart2 className="w-6 h-6 text-emerald-400" />
              <span className="text-xs font-semibold">Poll</span>
            </button>

            <button 
              onClick={() => setActiveTab('quiz')}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition"
            >
              <HelpCircle className="w-6 h-6 text-purple-400" />
              <span className="text-xs font-semibold">Quiz</span>
            </button>

            <button 
              onClick={() => setActiveTab('countdown')}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition"
            >
              <Calendar className="w-6 h-6 text-pink-400" />
              <span className="text-xs font-semibold">Countdown</span>
            </button>

            <button 
              onClick={() => setActiveTab('link')}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition"
            >
              <Link className="w-6 h-6 text-cyan-400" />
              <span className="text-xs font-semibold">Link</span>
            </button>

            <button 
              onClick={() => setActiveTab('weather')}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition"
            >
              <Sun className="w-6 h-6 text-yellow-400" />
              <span className="text-xs font-semibold">Weather</span>
            </button>

            <button 
              onClick={() => handleCreateSticker('gif', { url: 'https://media.giphy.com/media/t3kiY94RL1Kx2/giphy.gif' })}
              className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:bg-zinc-800/80 transition"
            >
              <Compass className="w-6 h-6 text-amber-400 animate-spin" />
              <span className="text-xs font-semibold">GIF</span>
            </button>
          </div>
        )}

        {/* Location configuration */}
        {activeTab === 'location' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-400" /> Add Location Sticker
            </h4>
            <Input 
              value={locationName} 
              onChange={(e) => setLocationName(e.target.value)} 
              placeholder="e.g. Paris, France" 
              className="bg-zinc-900 border-zinc-800"
            />
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('menu')} variant="outline" className="flex-1">Back</Button>
              <Button 
                onClick={() => handleCreateSticker('location', { name: locationName })}
                disabled={!locationName.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Mention configuration */}
        {activeTab === 'mention' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" /> Mention User
            </h4>
            <div className="relative">
              <span className="absolute left-3 top-3 text-zinc-500 text-sm font-semibold">@</span>
              <Input 
                value={mentionUser} 
                onChange={(e) => setMentionUser(e.target.value)} 
                placeholder="username" 
                className="pl-7 bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('menu')} variant="outline" className="flex-1">Back</Button>
              <Button 
                onClick={() => handleCreateSticker('mention', { username: mentionUser })}
                disabled={!mentionUser.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Hashtag configuration */}
        {activeTab === 'hashtag' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Hash className="w-4 h-4 text-orange-400" /> Hashtag Sticker
            </h4>
            <div className="relative">
              <span className="absolute left-3 top-3 text-zinc-500 text-sm font-semibold">#</span>
              <Input 
                value={hashtagText} 
                onChange={(e) => setHashtagText(e.target.value)} 
                placeholder="summer" 
                className="pl-7 bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('menu')} variant="outline" className="flex-1">Back</Button>
              <Button 
                onClick={() => handleCreateSticker('hashtag', { tag: hashtagText })}
                disabled={!hashtagText.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500"
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Poll configuration */}
        {activeTab === 'poll' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-400" /> Create Poll
            </h4>
            <Input 
              value={pollQuestion} 
              onChange={(e) => setPollQuestion(e.target.value)} 
              placeholder="Ask a question..." 
              className="bg-zinc-900 border-zinc-800"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input 
                value={pollOptions[0]} 
                onChange={(e) => setPollOptions([e.target.value, pollOptions[1]])} 
                placeholder="Option 1" 
                className="bg-zinc-900 border-zinc-800 text-center font-semibold"
              />
              <Input 
                value={pollOptions[1]} 
                onChange={(e) => setPollOptions([pollOptions[0], e.target.value])} 
                placeholder="Option 2" 
                className="bg-zinc-900 border-zinc-800 text-center font-semibold"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('menu')} variant="outline" className="flex-1">Back</Button>
              <Button 
                onClick={() => handleCreateSticker('poll', { question: pollQuestion, options: pollOptions, votes: [0, 0] })}
                disabled={!pollQuestion.trim() || !pollOptions[0].trim() || !pollOptions[1].trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500"
              >
                Add Poll
              </Button>
            </div>
          </div>
        )}

        {/* Quiz configuration */}
        {activeTab === 'quiz' && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" /> Create Quiz
            </h4>
            <Input 
              value={quizQuestion} 
              onChange={(e) => setQuizQuestion(e.target.value)} 
              placeholder="Quiz question..." 
              className="bg-zinc-900 border-zinc-800"
            />
            {quizOptions.map((opt, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input 
                  type="radio" 
                  name="correct-quiz" 
                  checked={quizCorrect === idx}
                  onChange={() => setQuizCorrect(idx)}
                  className="accent-indigo-500 w-4 h-4"
                />
                <Input 
                  value={opt}
                  onChange={(e) => {
                    const newOpts = [...quizOptions];
                    newOpts[idx] = e.target.value;
                    setQuizOptions(newOpts);
                  }}
                  placeholder={`Option ${idx + 1}`}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            ))}
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('menu')} variant="outline" className="flex-1">Back</Button>
              <Button 
                onClick={() => handleCreateSticker('quiz', { question: quizQuestion, options: quizOptions, correct: quizCorrect, votes: [0, 0, 0] })}
                disabled={!quizQuestion.trim() || quizOptions.some(o => !o.trim())}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500"
              >
                Add Quiz
              </Button>
            </div>
          </div>
        )}

        {/* Link configuration */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Link className="w-4 h-4 text-cyan-400" /> Add Link Sticker
            </h4>
            <Input 
              value={linkUrl} 
              onChange={(e) => setLinkUrl(e.target.value)} 
              placeholder="https://example.com" 
              className="bg-zinc-900 border-zinc-800"
            />
            <Input 
              value={linkText} 
              onChange={(e) => setLinkText(e.target.value)} 
              placeholder="Custom sticker text (optional)" 
              className="bg-zinc-900 border-zinc-800"
            />
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('menu')} variant="outline" className="flex-1">Back</Button>
              <Button 
                onClick={() => handleCreateSticker('link', { url: linkUrl, text: linkText || linkUrl })}
                disabled={!linkUrl.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500"
              >
                Add Link
              </Button>
            </div>
          </div>
        )}

        {/* Countdown configuration */}
        {activeTab === 'countdown' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-400" /> Create Countdown
            </h4>
            <Input 
              value={countdownTitle} 
              onChange={(e) => setCountdownTitle(e.target.value)} 
              placeholder="e.g. My Birthday!" 
              className="bg-zinc-900 border-zinc-800"
            />
            <Input 
              type="datetime-local"
              value={countdownDate} 
              onChange={(e) => setCountdownDate(e.target.value)} 
              className="bg-zinc-900 border-zinc-800 text-white"
            />
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('menu')} variant="outline" className="flex-1">Back</Button>
              <Button 
                onClick={() => handleCreateSticker('countdown', { title: countdownTitle, date: countdownDate })}
                disabled={!countdownTitle.trim() || !countdownDate}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500"
              >
                Add Countdown
              </Button>
            </div>
          </div>
        )}

        {/* Weather configuration */}
        {activeTab === 'weather' && (
          <div className="space-y-4">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <Sun className="w-4 h-4 text-yellow-400" /> Add Weather Sticker
            </h4>
            <div className="flex gap-2">
              <Input 
                value={weatherTemp} 
                onChange={(e) => setWeatherTemp(e.target.value)} 
                placeholder="72" 
                className="bg-zinc-900 border-zinc-800 flex-1 text-center"
              />
              <select 
                value={weatherIcon}
                onChange={(e) => setWeatherIcon(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-white flex-1"
              >
                <option value="☀️">☀️ Sunny</option>
                <option value="☁️">☁️ Cloudy</option>
                <option value="🌧️">🌧️ Rainy</option>
                <option value="❄️">❄️ Snowy</option>
                <option value="🌩️">🌩️ Stormy</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setActiveTab('menu')} variant="outline" className="flex-1">Back</Button>
              <Button 
                onClick={() => handleCreateSticker('weather', { temp: weatherTemp, icon: weatherIcon })}
                disabled={!weatherTemp.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500"
              >
                Add Weather
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
