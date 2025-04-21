import { useState, useEffect, useRef, useCallback } from "react"
import type { UseVoiceCallProps } from "@/lib/props"; // Import the moved type

// Helper function to write strings to DataView
// ... (float32ArrayToWav and writeString helpers remain here) ...
const writeString = (view: DataView, offset: number, string: string) => {
// ... existing helper code ...
};
const float32ArrayToWav = (samples: Float32Array): ArrayBuffer => {
// ... existing helper code ...
};

// Interface UseVoiceCallProps moved to props.ts

export function useVoiceCall({ onTranscription, onError }: UseVoiceCallProps = {}) {
  // ... rest of the hook implementation ...
} 