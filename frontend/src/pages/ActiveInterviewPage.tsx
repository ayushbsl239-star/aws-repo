import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Square,
  Send,
  RotateCcw,
  LogOut,
  Clock,
  Sparkles,
  Wifi,
  Cpu,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../services/api';
import { speakText } from '../services/voice';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { QuestionClient, DebugInfo } from '../types';
import { HackathonDebugPanel } from '../components/HackathonDebugPanel';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ErrorAlert } from '../components/ErrorAlert';

interface ActiveInterviewPageProps {
  debugMode: boolean;
}

export const ActiveInterviewPage: React.FC<ActiveInterviewPageProps> = ({ debugMode }) => {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State
  const [role, setRole] = useState('Data Analyst');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionClient | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [questionLimit, setQuestionLimit] = useState(5);
  const [currentDifficulty, setCurrentDifficulty] = useState(2);
  const [inputMode, setInputMode] = useState('text');

  // Input & Audio
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStateText, setLoadingStateText] = useState('Analysing your response...');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  // Polly TTS audio
  const [isSpeaking, setIsSpeaking] = useState(false);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  // Timer
  const [elapsedInterviewSeconds, setElapsedInterviewSeconds] = useState(0);

  // Push-to-talk voice hook
  const {
    isRecording,
    elapsedSeconds: recordingSeconds,
    isTranscribing,
    transcript,
    setTranscript,
    start: startVoiceRecording,
    stop: stopVoiceRecording,
    error: voiceError,
  } = useVoiceRecorder();

  // Load session or restore on accidental browser refresh
  useEffect(() => {
    if (!interviewId) return;
    loadSession();

    // Session timer
    const interval = setInterval(() => {
      setElapsedInterviewSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [interviewId]);

  // Sync transcription to answer input
  useEffect(() => {
    if (transcript) {
      setAnswerText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setTranscript('');
    }
  }, [transcript]);

  const loadSession = async () => {
    if (!interviewId) return;
    setError(null);
    try {
      const state = await api.getInterviewState(interviewId);
      if (state.status === 'COMPLETED') {
        navigate(`/report/${interviewId}`);
        return;
      }

      setRole(state.role || 'Data Analyst');
      setQuestionLimit(state.question_limit || 5);
      setCurrentDifficulty(state.current_difficulty || 2);
      setInputMode(state.input_mode || 'text');

      if (state.current_question) {
        setCurrentQuestion(state.current_question);
        setQuestionNumber(state.current_question.number || 1);
      } else {
        // First start
        const startRes = await api.startInterview(interviewId);
        setCurrentQuestion(startRes.first_question);
        setQuestionNumber(startRes.first_question.number || 1);
        setCurrentDifficulty(startRes.current_difficulty || 2);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize interview session.');
    }
  };

  const handleSpeakQuestion = async () => {
    if (!currentQuestion) return;
    if (isSpeaking) {
      if (activeAudioRef.current) activeAudioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    try {
      const audio = await speakText(currentQuestion.question);
      activeAudioRef.current = audio;
      if (audio) {
        audio.onended = () => setIsSpeaking(false);
      } else {
        // Fallback timer for Web Speech API
        setTimeout(() => setIsSpeaking(false), 5000);
      }
    } catch {
      setIsSpeaking(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!interviewId || !currentQuestion) return;
    const finalAnswer = answerText.trim();
    if (!finalAnswer) {
      setError('Please provide an answer before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setLoadingStateText('Analysing your response against objective rubrics...');

    try {
      const res = await api.submitAnswer(interviewId, currentQuestion.id, finalAnswer);

      // Save debug telemetry
      if (res.debug_info) {
        setDebugInfo(res.debug_info);
      }

      if (res.completed || res.interview_status === 'COMPLETED') {
        setLoadingStateText('Synthesizing final readiness score and 7-day plan...');
        setTimeout(() => navigate(`/report/${interviewId}`), 800);
        return;
      }

      if (res.next_question) {
        setCurrentQuestion(res.next_question);
        setQuestionNumber(res.next_question.number);
        setCurrentDifficulty(res.next_question.difficulty);
        setAnswerText('');

        // If voice mode, auto read aloud next question
        if (inputMode.includes('voice')) {
          speakText(res.next_question.question);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error evaluating answer. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExit = async () => {
    const confirmExit = window.confirm('Are you sure you want to end this interview early and view partial report?');
    if (confirmExit && interviewId) {
      try {
        await api.completeInterview(interviewId);
        navigate(`/report/${interviewId}`);
      } catch {
        navigate('/dashboard');
      }
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100">{role} Interview</h1>
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <span>Question {questionNumber} of {questionLimit}</span>
              <span>•</span>
              <span className="text-cyan-400">Difficulty {currentDifficulty}/5</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{formatTimer(elapsedInterviewSeconds)}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400">
            <Wifi className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Active</span>
          </div>

          <button
            onClick={handleExit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Exit interview"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Real-time Hackathon Debug Panel (if toggled) */}
      {debugMode && (
        <HackathonDebugPanel
          debugInfo={debugInfo}
          currentCompetency={currentQuestion?.skill}
          currentDifficulty={currentDifficulty}
        />
      )}

      {error && <ErrorAlert message={error} />}
      {voiceError && <ErrorAlert message={`Voice Error: ${voiceError}`} />}

      {/* QUESTION CARD */}
      <div className="glass-card p-6 sm:p-8 rounded-2xl border border-zinc-800 relative space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20 uppercase tracking-wider">
              {currentQuestion?.skill || 'General'}
            </span>
            <span className="text-xs text-zinc-500 font-mono capitalize">
              {currentQuestion?.type || 'Technical'} Focus
            </span>
          </div>

          <button
            onClick={handleSpeakQuestion}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isSpeaking
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800'
            }`}
            title="Read question aloud using Amazon Polly Neural TTS"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? 'Mute Question' : 'Read Aloud (Polly)'}</span>
          </button>
        </div>

        {/* Question Text */}
        <div className="py-2">
          <p className="text-base sm:text-lg font-medium text-zinc-100 leading-relaxed">
            {currentQuestion?.question || 'Loading interview question...'}
          </p>
        </div>
      </div>

      {/* CANDIDATE ANSWER SUBMISSION AREA */}
      <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4">
        {/* Voice Push-to-Talk Bar (if voice enabled) */}
        {inputMode.includes('voice') && (
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  disabled={isSubmitting || isTranscribing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50"
                >
                  <Mic className="w-4 h-4" />
                  Push to Talk (Record)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopVoiceRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-rose-400 font-medium text-xs border border-rose-500/40 animate-pulse transition-all"
                >
                  <Square className="w-4 h-4 fill-rose-400" />
                  Stop Recording ({recordingSeconds}s)
                </button>
              )}

              {isTranscribing && (
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Transcribing with Amazon Transcribe...</span>
                </div>
              )}
            </div>

            <span className="text-[11px] text-zinc-400">
              Push to speak. You can edit the transcription below before submitting.
            </span>
          </div>
        )}

        {/* Answer Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <label className="font-medium text-zinc-300">Your Response</label>
            <span className="font-mono text-[11px]">
              {answerText.length} characters • {answerText.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>

          <textarea
            rows={7}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            disabled={isSubmitting}
            placeholder="Type your response here or speak using the Push to Talk microphone..."
            className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-brand-500 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none leading-relaxed transition-all resize-y"
          />
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleSpeakQuestion}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Repeat Question
          </button>

          <button
            type="button"
            onClick={handleSubmitAnswer}
            disabled={isSubmitting || !answerText.trim()}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/25 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating Response...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Submit Answer</span>
              </>
            )}
          </button>
        </div>

        {isSubmitting && (
          <div className="pt-4 border-t border-zinc-900">
            <LoadingIndicator
              message={loadingStateText}
              subtext="Evaluating against rubrics: Technical accuracy, relevance, completeness, clarity, and reasoning..."
            />
          </div>
        )}
      </div>
    </div>
  );
};
