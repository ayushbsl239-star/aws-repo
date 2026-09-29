import { useEffect, useRef, useState } from 'react';
import { uploadAudioAndTranscribe, VoiceRecorder } from '../services/voice';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function start() {
    setError(null);
    try {
      recorderRef.current = new VoiceRecorder();
      await recorderRef.current.startRecording();
      setIsRecording(true);
      setElapsedSeconds(0);

      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Microphone access denied');
      setIsRecording(false);
    }
  }

  async function stop(): Promise<string> {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    if (!recorderRef.current) return '';

    setIsTranscribing(true);
    try {
      const blob = await recorderRef.current.stopRecording();
      const text = await uploadAudioAndTranscribe(blob);
      setTranscript(text);
      return text;
    } catch (err: any) {
      setError(err.message || 'Transcription failed');
      return '';
    } finally {
      setIsTranscribing(false);
    }
  }

  return {
    isRecording,
    elapsedSeconds,
    isTranscribing,
    transcript,
    setTranscript,
    error,
    start,
    stop,
  };
}
