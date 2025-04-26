import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { fetchAudio } from "@/lib/apis";
import { toast } from "react-toastify";
import { PhoneCallIcon } from "@/components/icons/PhoneCallIcon";

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

  // Memoized transcript value
  const transcriptValue = useMemo(() => selectedCall?.transcript || "", [selectedCall]);

  // Memoized status badge
  const StatusBadge = useMemo(() => {
    if (!selectedCall) return null;
    return (
      <>
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
      </>
    );
  }, [selectedCall]);

  // Memoized transcript area
  const TranscriptArea = useMemo(() => (
    <div className="flex-1 flex flex-col">
      <h4 className="font-medium mb-2">Transcript</h4>
      <textarea
        className="w-full h-40 p-3 border border-gray-200 rounded-lg bg-muted/30 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        id="transcript"
        value={transcriptValue}
        readOnly
      />
    </div>
  ), [transcriptValue]);

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
                {StatusBadge}
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
            {TranscriptArea}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
            <PhoneCallIcon className="h-12 w-12 mb-4" />
            <p>Select a call to play the recording</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CallPlayer;