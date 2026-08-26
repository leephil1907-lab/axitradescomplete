import React, { useState } from 'react';
import { ViewType } from '../types';
import { BookOpen, PlayCircle, CheckCircle2, ChevronRight, Award, GraduationCap, Clock, MonitorPlay } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AcademyViewProps {
  setView: (view: ViewType) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function AcademyView({ setView, showToast }: AcademyViewProps) {
  const [activeCourse, setActiveCourse] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizQuestion, setQuizQuestion] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const COURSES = [
    {
      id: 1,
      title: 'Basics of CFD Trading',
      duration: '45 Min',
      lessons: 5,
      level: 'Beginner',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=800',
      description: 'Learn the fundamental concepts of Contracts for Difference (CFDs), how they work, and why traders use them.'
    },
    {
      id: 2,
      title: 'Technical Analysis Masterclass',
      duration: '2 Hours',
      lessons: 12,
      level: 'Intermediate',
      image: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?auto=format&fit=crop&q=80&w=800',
      description: 'Master chart patterns, Japanese candlesticks, and technical indicators to improve your market timing.'
    },
    {
      id: 3,
      title: 'Risk Management Strategies',
      duration: '1 Hour',
      lessons: 8,
      level: 'Advanced',
      image: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800',
      description: 'Discover how professional traders manage their capital, set stop losses, and protect their downside.'
    }
  ];

  const QUIZ_QUESTIONS = [
    {
      question: "What does CFD stand for?",
      options: ["Contract For Deposit", "Contract For Difference", "Currency Forex Derivative", "Commodity Futures Desk"],
      correct: 1
    },
    {
      question: "If you 'go long' on a CFD, what are you expecting?",
      options: ["The price to go down", "The price to go up", "The price to stay the same", "The market to close"],
      correct: 1
    },
    {
      question: "What is leverage in CFD trading?",
      options: ["A guarantee against losses", "A tool that only increases profits", "Using borrowed capital to increase the potential return (and risk)", "A type of trading platform"],
      correct: 2
    }
  ];

  const handleAnswer = (index: number) => {
    if (index === QUIZ_QUESTIONS[quizQuestion].correct) {
      setQuizScore(s => s + 1);
    }
    
    if (quizQuestion < QUIZ_QUESTIONS.length - 1) {
      setQuizQuestion(q => q + 1);
    } else {
      setQuizFinished(true);
      if (quizScore + (index === QUIZ_QUESTIONS[quizQuestion].correct ? 1 : 0) === QUIZ_QUESTIONS.length) {
        showToast("Perfect score! You've mastered the basics.", "success");
      }
    }
  };

  return (
    <div className="bg-[#f8f7f5] min-h-screen font-sans">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white pt-24 pb-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 bg-[url('https://aximedia.s3.amazonaws.com/rebrand-prod/jnnpaysd/mobile-13.png')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Axi <span className="text-[#E3000F]">Academy</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-xl mx-auto md:mx-0 mb-8">
              Master the markets with free educational resources, interactive courses, and trading guides designed for all experience levels.
            </p>
            <button className="bg-[#FFD250] hover:bg-[#FFC518] text-slate-900 font-bold px-8 py-3.5 rounded-sm inline-flex items-center gap-2 transition shadow-lg">
              <GraduationCap className="w-5 h-5" /> Start Learning
            </button>
          </div>
          <div className="hidden md:flex flex-1 justify-end">
             <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-2xl relative">
                <div className="absolute -top-4 -left-4 bg-[#E3000F] text-white font-bold p-3 rounded-full shadow-lg">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-2">Your Progress</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full border-4 border-[#FFD250] flex items-center justify-center font-bold text-xl">
                    0%
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Courses Completed</p>
                    <p className="font-bold">0 of 3</p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-[#E3000F]" /> Featured Courses
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {COURSES.map((course) => (
            <div key={course.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-48 relative group cursor-pointer" onClick={() => setActiveCourse(course.id)}>
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <PlayCircle className="w-16 h-16 text-white" />
                </div>
                <div className="absolute top-3 left-3 bg-white text-slate-900 text-xs font-bold px-2.5 py-1 rounded">
                  {course.level}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-xl text-slate-900 mb-2">{course.title}</h3>
                <p className="text-slate-600 text-sm mb-4 flex-1">{course.description}</p>
                
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-t border-slate-100 pt-4 mt-auto">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#E3000F]" /> {course.duration}</span>
                  <span className="flex items-center gap-1.5"><MonitorPlay className="w-4 h-4 text-[#E3000F]" /> {course.lessons} Lessons</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Interactive Quiz Module */}
        <div className="mt-16 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 bg-slate-900 p-8 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <Award className="w-64 h-64" />
              </div>
              <h3 className="text-2xl font-bold mb-4 relative z-10">Knowledge Check</h3>
              <p className="text-slate-400 mb-8 relative z-10">Test your understanding of the basics of CFD trading to earn your first academy badge.</p>
              {!quizStarted && !quizFinished && (
                <button 
                  onClick={() => { setQuizStarted(true); setQuizQuestion(0); setQuizScore(0); setQuizFinished(false); }}
                  className="bg-[#E3000F] hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition w-full relative z-10"
                >
                  Start Quiz
                </button>
              )}
              {quizFinished && (
                <button 
                  onClick={() => { setQuizStarted(true); setQuizQuestion(0); setQuizScore(0); setQuizFinished(false); }}
                  className="bg-transparent border border-white hover:bg-white hover:text-slate-900 font-bold py-3 px-6 rounded transition w-full relative z-10 mt-4"
                >
                  Retake Quiz
                </button>
              )}
            </div>
            
            <div className="md:w-2/3 p-8">
              {!quizStarted && !quizFinished && (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-12">
                  <MonitorPlay className="w-16 h-16 mb-4 text-slate-300" />
                  <p>Click "Start Quiz" to begin the knowledge check.</p>
                </div>
              )}
              
              {quizStarted && !quizFinished && (
                <div className="flex flex-col h-full">
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-[#E3000F] uppercase tracking-wider">
                        Question {quizQuestion + 1} of {QUIZ_QUESTIONS.length}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {Math.round(((quizQuestion) / QUIZ_QUESTIONS.length) * 100)}% Completed
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-[#E3000F] h-full rounded-full transition-all duration-500"
                        style={{ width: `${((quizQuestion) / QUIZ_QUESTIONS.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={quizQuestion}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex flex-col"
                    >
                      <h4 className="text-xl font-bold text-slate-900 mb-6">{QUIZ_QUESTIONS[quizQuestion].question}</h4>
                      
                      <div className="flex flex-col gap-3">
                        {QUIZ_QUESTIONS[quizQuestion].options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            className="text-left p-4 rounded-lg border border-slate-200 hover:border-[#E3000F] hover:bg-red-50 transition-colors font-medium text-slate-700 flex justify-between items-center group shadow-sm"
                          >
                            {opt}
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-[#E3000F] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

              {quizFinished && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full flex flex-col items-center justify-center text-center py-8"
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${quizScore === QUIZ_QUESTIONS.length ? 'bg-emerald-100 text-emerald-500' : 'bg-slate-100 text-slate-500'}`}>
                    <Award className="w-12 h-12" />
                  </div>
                  <h4 className="text-2xl font-bold text-slate-900 mb-2">Quiz Complete!</h4>
                  <p className="text-slate-600 mb-6">
                    You scored <span className="font-bold text-slate-900">{quizScore}</span> out of <span className="font-bold text-slate-900">{QUIZ_QUESTIONS.length}</span>.
                  </p>
                  
                  {quizScore === QUIZ_QUESTIONS.length ? (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-5 h-5" /> Excellent work! You've mastered this topic.
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg flex items-center gap-2 font-medium">
                      Review the course materials and try again to get a perfect score!
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Modal Placeholder */}
      <AnimatePresence>
        {activeCourse !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
              onClick={() => setActiveCourse(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-black w-full max-w-4xl aspect-video relative z-10 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center border border-slate-700"
            >
              <button 
                onClick={() => setActiveCourse(null)}
                className="absolute top-4 right-4 text-white hover:text-[#E3000F] z-20 bg-black/50 p-2 rounded-full"
              >
                Close
              </button>
              <div className="text-center text-white p-8">
                <PlayCircle className="w-20 h-20 text-[#E3000F] mx-auto mb-4 opacity-80" />
                <h3 className="text-2xl font-bold mb-2">Axi Academy Video Player</h3>
                <p className="text-slate-400">Course {activeCourse} video content would play here.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
