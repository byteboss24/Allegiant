"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react"

interface CallDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId?: number
}

export function CallDialog({
  open,
  onOpenChange,
  agentId
}: CallDialogProps) {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState("disconnected")

  const websocketRef = useRef<WebSocket | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioSourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)

  // Add state for audio playback
  const [audioQueue, setAudioQueue] = useState<HTMLAudioElement[]>([])
  const audioQueueRef = useRef<HTMLAudioElement[]>([])

  // Convert Float32Array to WAV format
  const float32ArrayToWav = (samples: Float32Array): ArrayBuffer => {
    const numChannels = 1;
    const sampleRate = 8000;
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
  
  // Helper function to write strings to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Send audio data through WebSocket
  const sendAudioData = async (audioData: Float32Array) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      try {
        // Convert to WAV format
        const wavBuffer = float32ArrayToWav(audioData);
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const reader = new FileReader();
        
        reader.onload = () => {
          const base64Audio = reader.result?.toString().split(',')[1];
          if (base64Audio) {
            websocketRef.current?.send(JSON.stringify({
              audio_data: base64Audio
            }));
          }
        };
        
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Error processing audio data:', error);
      }
    }
  }
  
  const initializeAudio = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices are not supported in this browser');
      }

      // Check if AudioContext is supported
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        throw new Error('AudioContext is not supported in this browser');
      }

      audioContextRef.current = new AudioContext({
        sampleRate: 8000,
        latencyHint: 'interactive'
      });

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
        throw new Error('Could not access microphone. Please ensure microphone permissions are granted.');
      }

      audioSourceRef.current = audioContextRef.current.createMediaStreamSource(micStreamRef.current);

      const workletNode = new AudioWorkletNode(audioContextRef.current, 'audio-processor');
      workletNode.port.onmessage = (event) => {
        if (!isMuted) {
          sendAudioData(event.data);
        }
      };

      audioDestinationRef.current = audioContextRef.current.createMediaStreamDestination();

      audioSourceRef.current.connect(workletNode);
      workletNode.connect(audioDestinationRef.current);

      console.log("Audio initialized successfully");
    } catch (error) {
      console.error("Error initializing audio:", error);
      alert(error instanceof Error ? error.message : 'Failed to initialize audio');
    }
  }

  const playNextAudio = () => {
    if (audioQueueRef.current.length > 0 && isSpeakerOn) {
      const audio = audioQueueRef.current.shift();
      if (audio) {
        audio.onended = () => {
          playNextAudio();
        };
        audio.play().catch((error: Error) => {
          console.error('Error playing audio:', error);
          playNextAudio();
        });
      }
    }
  };

  // Initialize WebSocket connection
  const initializeWebSocket = () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = `${API_BASE_URL?.replace('http', 'ws')}/twilio/media-stream`;
    console.log("WebSocket URL:", wsUrl);

    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => {
      setConnectionStatus("connected");
      console.log("WebSocket connection established");
      
      // Send the required 'start' event to initialize the stream
      const startMessage = {
        event: 'start',
        start: {
          streamSid: 'frontend-initiated-' + Date.now()
        }
      };
      websocketRef.current?.send(JSON.stringify(startMessage));
    };

    websocketRef.current.onclose = () => {
      setConnectionStatus("disconnected");
      console.log("WebSocket connection closed");
    };

    websocketRef.current.onerror = (error) => {
      setConnectionStatus("error");
      console.error("WebSocket error:", error);
    };

    websocketRef.current.onmessage = (event) => {
      if (event.data instanceof Blob) {
        // Handle incoming audio data
        const audioUrl = URL.createObjectURL(event.data);
        const audio = new Audio(audioUrl);
        
        // Add to queue and update state
        audioQueueRef.current.push(audio);
        setAudioQueue(prev => [...prev, audio]);
        
        // Start playing if queue was empty
        if (audioQueueRef.current.length === 1) {
          playNextAudio();
        }
      } else {
        try {
          // Handle text response (transcription)
          const data = JSON.parse(event.data);
          if (data.type === 'transcription') {
            console.log("Transcription:", data.text);
            // You might want to add a state for transcription and display it in the UI
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      }
    };
  };

  // Start call
  const startCall = async () => {
    await initializeAudio()
    initializeWebSocket()
    setIsCallActive(true)
  }

  // End call
  const endCall = () => {
    if (websocketRef.current) {
      websocketRef.current.close()
    }

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop())
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    setIsCallActive(false)
    setConnectionStatus("disconnected")
  }

  // Toggle mute
  const toggleMute = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted
      })
      setIsMuted(!isMuted)
    }
  }

  // Update speaker toggle to handle audio queue
  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (!isSpeakerOn) {
      // Resume playing if speaker is turned on
      playNextAudio();
    } else {
      // Pause all audio if speaker is turned off
      audioQueueRef.current.forEach(audio => {
        audio.pause();
      });
    }
  }

  // Handle dialog close
  const handleClose = () => {
    if (isCallActive) {
      endCall();
    }
    onOpenChange(false);
  };

  // Cleanup on component unmount or dialog close
  useEffect(() => {
    if (!open && isCallActive) {
      endCall();
    }

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close()
      }

      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((track) => track.stop())
      }

      if (audioContextRef.current) {
        audioContextRef.current.close()
      }

      // Clean up audio queue on unmount
      audioQueueRef.current.forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      audioQueueRef.current = [];
    }
  }, [open, isCallActive])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Voice Call</DialogTitle>
          <div className="flex justify-center">
            <Badge variant={connectionStatus === "connected" ? "default" : "destructive"} className="mt-2">
              {connectionStatus === "connected" ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Phone className={`h-12 w-12 ${isCallActive ? "text-primary" : "text-muted-foreground"}`} />
          </div>

          {isCallActive && (
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="icon" className={isMuted ? "bg-red-100" : ""} onClick={toggleMute}>
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={!isSpeakerOn ? "bg-red-100" : ""}
                onClick={toggleSpeaker}
              >
                {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-center">
          {!isCallActive ? (
            <Button onClick={startCall} className="px-8">
              Start Call
            </Button>
          ) : (
            <Button variant="destructive" onClick={endCall} className="px-8">
              <PhoneOff className="mr-2 h-4 w-4" /> End Call
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
