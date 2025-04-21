"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from "lucide-react"
import type { CallDialogProps } from "@/lib/props"
import { useVoiceCall } from "@/hooks/use-voice-call"
import { useToast } from "@/hooks/use-toast"

export function CallDialog({
  open,
  onOpenChange,
  agentId
}: CallDialogProps) {

  const { toast } = useToast()

  const handleTranscription = (text: string) => {
    console.log("Transcription received in component:", text);
    // Update UI or state based on transcription if needed
  };

  const handleError = (message: string) => {
    console.error("Voice call error:", message);
    toast({
      title: "Call Error",
      description: message,
      variant: "destructive",
    });
  };

  const {
    isCallActive,
    isMuted,
    isSpeakerOn,
    connectionStatus,
    startCall,
    endCall,
    toggleMute,
    toggleSpeaker,
  } = useVoiceCall({ onTranscription: handleTranscription, onError: handleError });

  const handleClose = () => {
    if (isCallActive) {
      endCall();
    }
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open && isCallActive) {
      endCall();
    }
  }, [open, isCallActive, endCall]);

  const getBadgeVariant = () => {
    switch (connectionStatus) {
      case "connected": return "default";
      case "connecting": return "outline";
      case "error": return "destructive";
      case "disconnected":
      default: return "secondary";
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected": return "Connected";
      case "connecting": return "Connecting...";
      case "error": return "Error";
      case "disconnected":
      default: return "Disconnected";
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Voice Call</DialogTitle>
          <div className="flex justify-center">
            <Badge variant={getBadgeVariant()} className="mt-2 capitalize">
              {getConnectionStatusText()}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
            <Phone className={`h-12 w-12 ${isCallActive && connectionStatus === 'connected' ? "text-primary" : "text-muted-foreground"}`} />
          </div>

          {isCallActive && connectionStatus === 'connected' && (
            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="icon" className={isMuted ? "bg-red-100 hover:bg-red-200" : ""} onClick={toggleMute}>
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className={!isSpeakerOn ? "bg-red-100 hover:bg-red-200" : ""}
                onClick={toggleSpeaker}
              >
                {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-center">
          {!isCallActive ? (
            <Button 
              onClick={startCall} 
              className="px-8" 
              disabled={connectionStatus === 'connecting'}
            >
              {connectionStatus === 'connecting' ? "Connecting..." : "Start Call"}
            </Button>
          ) : (
            <Button 
              variant="destructive" 
              onClick={endCall} 
              className="px-8"
              disabled={connectionStatus === 'disconnected'}
             >
              <PhoneOff className="mr-2 h-4 w-4" /> End Call
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
