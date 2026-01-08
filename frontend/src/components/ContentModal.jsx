import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  X,
  BookOpen,
  Brain,
  GraduationCap,
  Loader2,
  Trophy,
  Volume2,
  Square
} from 'lucide-react';
import QuizModal from './QuizModal';

const ContentModal = ({
  isOpen,
  onClose,
  data,
  topic,
  subtopic,
  onModeChange,
  loading,
  currentMode = 'story',
  difficulty,
  roadmapId
}) => {
  const [showQuiz, setShowQuiz] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [isOpen, currentMode]);

  if (!isOpen) return null;

  const modes = [
    { id: 'story', label: 'Story Mode', icon: BookOpen },
    { id: 'deep', label: 'Deep Dive', icon: Brain },
    { id: 'exam', label: 'Exam Prep', icon: GraduationCap },
  ];

  const speakContent = () => {
    if (!data?.content) return;
    window.speechSynthesis.cancel();
    const text = data.content.replace(/[#_*`>-]/g, '').replace(/\n+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (voice) utterance.voice = voice;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    setTimeout(() => { window.speechSynthesis.speak(utterance); }, 250);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <div className="absolute inset-4 flex items-center justify-center">
        <div className="w-full h-full max-w-6xl bg-[#0f0f1a] rounded-2xl flex flex-col overflow-hidden">
          
          <div className="px-6 py-4 border-b border-gray-800 bg-[#111827]">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{subtopic}</h2>
                <p className="text-sm text-gray-400">{topic}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={isSpeaking ? stopSpeaking : speakContent}
                  className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-all ${
                    isSpeaking ? 'bg-red-500/20 text-red-400 border-red-500/40' : 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                  }`}
                >
                  {isSpeaking ? <><Square size={18} /> Stop</> : <><Volume2 size={18} /> Read</>}
                </button>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              {modes.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onModeChange(mode.id)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors ${
                      currentMode === mode.id ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    <Icon size={16} />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="animate-spin text-blue-500" />
              </div>
            ) : data && (
              <>
                {/* RESTORED VIDEOS SECTION */}
                {data.videos?.length > 0 && (
                  <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.videos.map((url, i) => (
                      <a 
                        key={i} 
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 border border-gray-700 transition-colors group"
                      >
                        <div className="text-center">
                          <div className="bg-red-600 p-2 rounded-full inline-block mb-2 group-hover:scale-110 transition-transform">
                            <BookOpen size={20} className="text-white" />
                          </div>
                          <p className="text-xs text-gray-300">Watch Tutorial {i + 1}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                <div className="prose-custom">
                  <ReactMarkdown>{data.content}</ReactMarkdown>
                </div>
                
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white flex items-center gap-3 hover:scale-105 transition-transform"
                  >
                    <Trophy /> Attempt Quiz
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <QuizModal
        isOpen={showQuiz}
        onClose={() => setShowQuiz(false)}
        topic={topic}
        subtopic={subtopic}
        difficulty={difficulty}
        language="English"
        roadmapId={roadmapId}
      />
    </div>
  );
};

export default ContentModal;