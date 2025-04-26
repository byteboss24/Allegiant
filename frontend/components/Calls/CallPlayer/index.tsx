import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React, { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { fetchAudio } from "@/lib/apis";
import { toast } from "react-toastify";

interface CallPlayerProps {
  selectedCall: any;
}

export const CallPlayer: React.FC<CallPlayerProps> = ({ selectedCall }) => {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!selectedCall) return;
    let isCancelled = false;
    const loadAudio = async () => {
      setAudioLoading(true);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      try {
        const blob = await fetchAudio(selectedCall.audio_url);
        const url = URL.createObjectURL(blob);
        if (isCancelled) return;
        setAudioUrl(url);
        setAudioLoading(false);
        setTimeout(() => {
          if (audioRef.current) {
            const audio = audioRef.current;
            const onCanPlay = () => {
              audio.play().catch(e => console.error("Error playing audio:", e));
              audio.removeEventListener('canplaythrough', onCanPlay);
            };
            audio.addEventListener('canplaythrough', onCanPlay);
            audio.load();
          }
        }, 0);
      } catch (error) {
        if (isCancelled) return;
        setAudioLoading(false);
        console.error('Error fetching/playing audio:', error);
        toast.error("Failed to load or play audio recording.");
      }
    };
    loadAudio();
    return () => {
      isCancelled = true;
    };
  }, [selectedCall]);

  return (
    <Card className="h-full bg-white/80 dark:bg-background/70 shadow-lg border border-blue-100 dark:border-blue-900 rounded-2xl backdrop-blur flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle>Call Player</CardTitle>
        <CardDescription>Listen to selected call recording</CardDescription>
      </CardHeader>
      <Separator className="mb-2" />
      <CardContent className="space-y-6 flex-1 flex flex-col">
        {selectedCall ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-16 w-16 mb-2 shadow-md">
                <AvatarFallback>
                  {selectedCall.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">
                {selectedCall.first_name} {selectedCall.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedCall.created_at}
              </p>
              <div className="flex justify-center items-center gap-2 mt-2">
                {selectedCall.status?.toUpperCase() === "SMS" ? (
                  <Badge variant="secondary">CALLED</Badge>
                ) : null}
                <Badge
                  variant={
                    selectedCall.status === "completed" || selectedCall.status === "sms"
                      ? "secondary"
                      : selectedCall.status === "pending"
                      ? "outline"
                      : "destructive"
                  }
                >
                  {selectedCall.status?.toUpperCase() === "SMS"
                    ? "SMS Sent"
                    : selectedCall.status?.toUpperCase() === "COMPLETED"
                    ? "CALLED"
                    : selectedCall.status?.toUpperCase() === "COMPLETED2"
                    ? "CALLED"
                    : selectedCall.status?.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {selectedCall.duration}
                </span>
              </div>
            </div>
            <Separator className="my-2" />
            <div className="space-y-4 pt-2">
              {(audioLoading || audioUrl) && (
                <div className="relative">
                  <audio ref={audioRef} controls className="mt-2 w-full">
                    {audioUrl ? (
                      <source src={audioUrl} type="audio/wav" />
                    ) : null}
                    Your browser does not support the audio element.
                  </audio>
                  {audioLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded-lg">
                      <span className="text-muted-foreground text-sm">
                        Loading audio...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Separator className="my-2" />
            <div className="flex-1 flex flex-col">
              <h4 className="font-medium mb-2">Transcript</h4>
              <textarea
                className="w-full h-40 p-3 border border-gray-200 rounded-lg bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                id="transcript"
                value={selectedCall?.transcript || ""}
                readOnly
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12 mb-4"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <p>Select a call to play the recording</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CallPlayer;