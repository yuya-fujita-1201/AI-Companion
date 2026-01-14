import { useCallback, useRef, useState } from "react";

type TranscriptionResult = {
  text: string;
};

export function useVoiceInput() {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return Promise.resolve<Blob | null>(null);
    return new Promise<Blob | null>((resolve) => {
      mediaRecorderRef.current!.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setIsRecording(false);
        mediaRecorderRef.current = null;
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        resolve(blob);
      };
      mediaRecorderRef.current!.stop();
    });
  }, []);

  const transcribeAudio = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", blob, "voice.webm");
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Transcription failed");
      }
      const data = (await response.json()) as TranscriptionResult;
      return data.text;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  return {
    isRecording,
    isTranscribing,
    startRecording,
    stopRecording,
    transcribeAudio,
  };
}
