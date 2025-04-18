import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import React, { RefObject } from "react";
import type { CallPlayerProps } from "@props";

export const CallPlayer: React.FC<CallPlayerProps> = ({
  selectedCall,
  audioLoading,
  audioUrl,
  audioRef,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Call Player</CardTitle>
        <CardDescription>Listen to selected call recording</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedCall ? (
          <>
            <div className="text-center space-y-2">
              <h3 className="font-medium">{selectedCall.first_name} {selectedCall.last_name}</h3>
              <p className="text-sm text-muted-foreground">{selectedCall.created_at}</p>
              <div className="flex justify-center items-center gap-2 mt-4">
                <Badge
                  variant={
                    selectedCall.status === "Transferred"
                      ? "default"
                      : selectedCall.status === "SMS Sent"
                        ? "outline"
                        : selectedCall.status === "No Answer"
                          ? "destructive"
                          : "secondary"
                  }
                >
                  {selectedCall.status}
                </Badge>
                <span className="text-sm text-muted-foreground">{selectedCall.duration}</span>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              {(audioLoading || audioUrl) && (
                <div className="relative">
                  <audio ref={audioRef} controls className="mt-4 w-full">
                    {audioUrl ? (
                      <source src={audioUrl} type="audio/wav" />
                    ) : null}
                    Your browser does not support the audio element.
                  </audio>
                  {audioLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                      <span className="text-muted-foreground text-sm">Loading audio...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4">
              <h4 className="font-medium mb-2">Transcript</h4>
              <textarea
                className="w-full h-48 p-2 border rounded"
                id="transcript"
                value={selectedCall?.transcript || ''}
                readOnly
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" size="sm">
                Share
              </Button>
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