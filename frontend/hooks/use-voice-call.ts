import { useState, useEffect, useRef, useCallback } from "react"

// Helper function to write strings to DataView
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

// Convert Float32Array to WAV format
const float32ArrayToWav = (samples: Float32Array): ArrayBuffer => {
  const numChannels = 1;
  const sampleRate = 8000; // Ensure this matches your AudioContext sample rate
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write audio data
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const sample = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return buffer;
};

interface UseVoiceCallProps {
  onTranscription?: (text: string) => void;
  onError?: (message: string) => void;
}

export function useVoiceCall({ onTranscription, onError }: UseVoiceCallProps = {}) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected")

  const websocketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);

  const audioQueueRef = useRef<HTMLAudioElement[]>([])
  const isPlayingRef = useRef(false);

  const reportError = useCallback((message: string) => {
    console.error(message);
    if (onError) {
      onError(message);
    } else {
      alert(message);
    }
  }, [onError]);

  // Send audio data through WebSocket
  const sendAudioData = useCallback(async (audioData: Float32Array) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN && !isMuted) {
      try {
        const wavBuffer = float32ArrayToWav(audioData);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        
        // Send as binary data if possible (check backend capability)
        if (websocketRef.current?.binaryType === "blob" || websocketRef.current?.binaryType === "arraybuffer") {
            websocketRef.current.send(blob);
        } else {
             // Fallback to Base64 encoding
            const reader = new FileReader();
            reader.onload = () => {
                const base64Audio = reader.result?.toString().split(',')[1];
                if (base64Audio) {
                    websocketRef.current?.send(JSON.stringify({
                    event: 'media',
                    media: {
                        payload: base64Audio
                    }
                    }));
                }
            };
            reader.readAsDataURL(blob);
        }
      } catch (error) {
        console.error('Error processing audio data:', error);
        reportError("Error processing audio data");
      }
    }
  }, [isMuted, reportError]);

  const initializeAudio = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices are not supported in this browser');
      }

      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        throw new Error('AudioContext is not supported in this browser');
      }

      // Close existing context if any
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close();
      }
      
      audioContextRef.current = new AudioContext({
        sampleRate: 8000,
        latencyHint: 'interactive'
      });

      // Ensure audio context is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      try {
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 8000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true
          },
          video: false,
        });
      } catch (mediaError) {
        console.error('Error accessing microphone:', mediaError);
        throw new Error('Could not access microphone. Please ensure permissions are granted.');
      }

      audioSourceRef.current = audioContextRef.current.createMediaStreamSource(micStreamRef.current);
      
      // Load the AudioWorklet processor
      try {
        await audioContextRef.current.audioWorklet.addModule('/audio-processor.js'); 
      } catch (workletError) {
        console.error("Error loading AudioWorklet module:", workletError);
        throw new Error("Failed to load audio processor.");
      }

      audioWorkletNodeRef.current = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      audioWorkletNodeRef.current.port.onmessage = (event) => {
        sendAudioData(event.data);
      };

      audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();
      audioSourceRef.current.connect(audioWorkletNodeRef.current);

      console.log("Audio initialized successfully");
      return true;
    } catch (error) {
      reportError(error instanceof Error ? error.message : 'Failed to initialize audio');
      return false;
    }
  }, [sendAudioData, reportError]);

  const playNextAudio = useCallback(() => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0 || !isSpeakerOn) {
      return;
    }

    const audio = audioQueueRef.current.shift();
    if (audio) {
      isPlayingRef.current = true;
      audio.onended = () => {
        URL.revokeObjectURL(audio.src);
        isPlayingRef.current = false;
        playNextAudio();
      };
      audio.onerror = (e) => {
        console.error('Error playing audio:', e);
        URL.revokeObjectURL(audio.src);
        isPlayingRef.current = false;
        playNextAudio();
      };
      audio.play().catch((error: Error) => {
        console.error('Error initiating audio playback:', error);
        URL.revokeObjectURL(audio.src);
        isPlayingRef.current = false;
        playNextAudio(); // Attempt to play next item
      });
    }
  }, [isSpeakerOn]);

  const initializeWebSocket = useCallback(() => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_BASE_URL) {
        reportError("API URL is not configured.");
        return false;
    }
    const wsUrl = `${API_BASE_URL.replace(/^http/, 'ws')}/twilio/media-stream`;
    console.log("Attempting WebSocket connection to:", wsUrl);
    setConnectionStatus("connecting");

    // Close existing socket if any
    if (websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
        websocketRef.current.close();
    }

    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => {
      setConnectionStatus("connected");
      console.log("WebSocket connection established");
      
      // Send the required 'start' event
      const startMessage = {
        event: 'start',
        start: {
          streamSid: 'frontend-ws-' + Date.now() 
        }
      };
      websocketRef.current?.send(JSON.stringify(startMessage));
    };

    websocketRef.current.onclose = (event) => {
      setConnectionStatus("disconnected");
      console.log("WebSocket connection closed:", event.code, event.reason);
      // Clean up audio queue on disconnect
      audioQueueRef.current.forEach(audio => {
        audio.pause();
        if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
      });
      audioQueueRef.current = [];
      isPlayingRef.current = false;
    };

    websocketRef.current.onerror = (error) => {
      setConnectionStatus("error");
      console.error("WebSocket error:", error);
      reportError("WebSocket connection error.");
    };

    websocketRef.current.onmessage = (event) => {
      if (event.data instanceof Blob) {
        // Handle incoming audio data (assuming WAV)
        const audioUrl = URL.createObjectURL(event.data);
        const audio = new Audio(audioUrl);
        
        audioQueueRef.current.push(audio);
        playNextAudio();
      } else {
        try {
          // Handle text messages (e.g., transcription, status)
          const data = JSON.parse(event.data);
          console.log("Received message:", data);
          if (data.event === 'media' && data.media && data.media.track === 'outbound') {
          } else if (data.event === 'transcription') {
             if (onTranscription) {
              onTranscription(data.text);
             }
          } else if (data.event === 'stop') {
             console.log("Received stop event from server");
             // Optionally close the connection or handle accordingly
          }
        } catch (error) {
          console.error("Error parsing message or unexpected format:", event.data);
        }
      }
    };
    return true;
  }, [playNextAudio, onTranscription, reportError]);

  const startCall = useCallback(async () => {
    const audioReady = await initializeAudio();
    if (audioReady) {
        const socketReady = initializeWebSocket();
        if(socketReady) {
            setIsCallActive(true);
        }
    }
  }, [initializeAudio, initializeWebSocket]);

  const cleanupResources = useCallback(() => {
    console.log("Cleaning up voice call resources...");
    // Close WebSocket
    if (websocketRef.current && websocketRef.current.readyState !== WebSocket.CLOSED) {
      // Send a 'stop' message before closing if required by the protocol
      const stopMessage = { event: 'stop' };
      websocketRef.current.send(JSON.stringify(stopMessage));
      websocketRef.current.close();
      websocketRef.current = null;
    }

    // Stop media tracks
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }

    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
      audioContextRef.current = null;
    }

    // Clean up audio queue
    audioQueueRef.current.forEach(audio => {
        audio.pause();
        if (audio.src.startsWith('blob:')) URL.revokeObjectURL(audio.src);
    });
    audioQueueRef.current = [];
    isPlayingRef.current = false;

    audioSourceRef.current = null;
    audioDestinationRef.current = null;
    audioWorkletNodeRef.current = null;

  }, []);

  const endCall = useCallback(() => {
    cleanupResources();
    setIsCallActive(false);
    setConnectionStatus("disconnected");
    setIsMuted(false);
    setIsSpeakerOn(true);
  }, [cleanupResources]);

  const toggleMute = useCallback(() => {
    setIsMuted((prevMuted) => {
        const nextMuted = !prevMuted;
        if (micStreamRef.current) {
            micStreamRef.current.getAudioTracks().forEach((track) => {
                track.enabled = !nextMuted;
            });
        }
        console.log(`Microphone ${nextMuted ? 'muted' : 'unmuted'}`);
        return nextMuted;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prevSpeakerOn) => {
        const nextSpeakerOn = !prevSpeakerOn;
        console.log(`Speaker ${nextSpeakerOn ? 'enabled' : 'disabled'}`);
        if (nextSpeakerOn) {
            // If turning speaker ON, start playing if queue has items
            playNextAudio();
        } else {
            // If turning speaker OFF, pause all currently playing/queued audio
            audioQueueRef.current.forEach(audio => {
                audio.pause();
                // Don't revoke URL here, just pause
            });
            // If an audio element was actively playing, stop it
            if (isPlayingRef.current) {
                // Find the currently playing audio element if needed, though pausing all is generally sufficient
            }
        }
        return nextSpeakerOn;
    });
  }, [playNextAudio]);

  // Effect for cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  return {
    isCallActive,
    isMuted,
    isSpeakerOn,
    connectionStatus,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  }
} 