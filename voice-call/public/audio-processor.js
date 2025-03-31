class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 8000; // 1 second of audio at 8kHz
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.silenceThreshold = 0.01; // Adjust this value based on your needs
    this.silenceCounter = 0;
    this.silenceFrames = 50; // About 0.5 seconds of silence
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const inputData = input[0];
    
    // Calculate RMS value for silence detection
    let rms = 0;
    for (let i = 0; i < inputData.length; i++) {
      rms += inputData[i] * inputData[i];
    }
    rms = Math.sqrt(rms / inputData.length);
    
    // Check for silence
    if (rms < this.silenceThreshold) {
      this.silenceCounter++;
      if (this.silenceCounter >= this.silenceFrames) {
        // Send silence detected signal
        this.port.postMessage({ type: 'silence_detected' });
        this.silenceCounter = 0;
      }
    } else {
      this.silenceCounter = 0;
    }
    
    // Copy input data to buffer
    for (let i = 0; i < inputData.length; i++) {
      this.buffer[this.bufferIndex] = inputData[i];
      this.bufferIndex++;

      // When buffer is full, send it
      if (this.bufferIndex >= this.bufferSize) {
        this.port.postMessage(this.buffer.slice(0));
        this.bufferIndex = 0;
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor); 