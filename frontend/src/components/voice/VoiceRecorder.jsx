import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiMicrophone, HiStop, HiSpeakerphone, HiTranslate, HiRefresh, HiCheck } from 'react-icons/hi';

const LANGUAGE_MAP = {
  'hi-IN': { label: 'Hindi', code: 'hi' },
  'en-IN': { label: 'English', code: 'en' },
};

export default function VoiceRecorder({ onTranscript, language = 'en-IN' }) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [audioURL, setAudioURL] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [volume, setVolume] = useState(0);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const volumeIntervalRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioURL(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = language;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          let final = '';
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript;
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (final) setTranscript(prev => prev + final);
          setInterimText(interim);
        };

        recognition.onerror = () => {};
        recognition.start();
        recognitionRef.current = recognition;
      } else {
        setIsSupported(false);
      }

      setIsRecording(true);

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      volumeIntervalRef.current = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        setVolume(Math.min(avg / 128, 1));
      }, 100);
    } catch {
      setIsSupported(false);
    }
  }, [language]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (volumeIntervalRef.current) {
      clearInterval(volumeIntervalRef.current);
      volumeIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setVolume(0);
    if (transcript.trim()) {
      onTranscript?.(transcript.trim());
    }
  }, [transcript, onTranscript]);

  const resetRecording = () => {
    setTranscript('');
    setInterimText('');
    setAudioURL(null);
  };

  if (!isSupported) {
    return (
      <div className="card-glass p-6 text-center">
        <HiSpeakerphone className="mx-auto text-beige-300 mb-3" size={40} />
        <p className="text-earth-600">Voice recording is not supported in your browser. Please use Chrome or Edge.</p>
      </div>
    );
  }

  return (
    <div className="card-glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl text-forest-700">Voice Report</h3>
        <span className="flex items-center gap-1 text-xs text-earth-500 bg-beige-50 px-3 py-1 rounded-full">
          <HiTranslate size={12} />
          {LANGUAGE_MAP[language]?.label || 'English'}
        </span>
      </div>

      <div className="flex flex-col items-center py-6 gap-4">
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="recording"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-red-400/20"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-red-400/10"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <button
                onClick={stopRecording}
                className="relative w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                <HiStop size={28} />
              </button>
              <motion.div
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1"
                initial={false}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-red-400 rounded-full"
                    animate={{
                      height: [4, 12 + volume * 20 * (i + 1), 4],
                    }}
                    transition={{ duration: 0.5 + i * 0.1, repeat: Infinity }}
                  />
                ))}
              </motion.div>
            </motion.div>
          ) : (
            <motion.button
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={startRecording}
              className="w-20 h-20 rounded-full bg-forest-500 text-white flex items-center justify-center shadow-lg hover:bg-forest-600 transition-colors"
            >
              <HiMicrophone size={28} />
            </motion.button>
          )}
        </AnimatePresence>

        <p className="text-sm text-earth-500 font-medium">
          {isRecording ? 'Tap to stop recording' : 'Tap to speak your complaint'}
        </p>
      </div>

      {(transcript || interimText) && (
        <div className="bg-white/60 rounded-xl p-4 min-h-[80px] border border-beige-200">
          <p className="text-earth-700">
            {transcript}
            {interimText && (
              <span className="text-earth-400 italic">{interimText}</span>
            )}
          </p>
        </div>
      )}

      {audioURL && (
        <div className="flex items-center gap-3 bg-beige-50 rounded-xl p-3">
          <audio src={audioURL} controls className="flex-1 h-10" />
        </div>
      )}

      <div className="flex gap-2">
        {isRecording && (
          <button onClick={stopRecording} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <HiStop size={16} />
            Stop Recording
          </button>
        )}
        {!isRecording && transcript && (
          <>
            <button onClick={resetRecording} className="btn-ghost flex items-center gap-2">
              <HiRefresh size={16} />
              Reset
            </button>
            <button onClick={() => onTranscript?.(transcript.trim())} className="btn-primary flex-1 flex items-center justify-center gap-2">
              <HiCheck size={16} />
              Use Text
            </button>
          </>
        )}
      </div>
    </div>
  );
}
