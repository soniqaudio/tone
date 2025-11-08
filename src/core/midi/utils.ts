const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const midiNumberToName = (noteNumber: number) => {
  const octave = Math.floor(noteNumber / 12) - 1;
  const noteIndex = noteNumber % 12;
  return `${NOTE_NAMES[noteIndex]}${octave}`;
};

export const midiNumberToFrequency = (noteNumber: number) => {
  const a4 = 69;
  const a4Freq = 440;
  return a4Freq * 2 ** ((noteNumber - a4) / 12);
};

export interface ParsedMidiMessage {
  messageType: "noteon" | "noteoff" | "control" | "unknown";
  channel: number;
  noteNumber?: number;
  velocity?: number;
  controlNumber?: number;
  value?: number;
}

export const parseMidiMessage = (event: MIDIMessageEvent): ParsedMidiMessage => {
  const dataArray = event.data || new Uint8Array([0, 0, 0]);
  const [statusByte, data1 = 0, data2 = 0] = dataArray;
  const messageType = statusByte & 0xf0;
  const channel = statusByte & 0x0f;

  switch (messageType) {
    case 0x80:
      return {
        messageType: "noteoff",
        channel,
        noteNumber: data1,
        velocity: data2,
      };
    case 0x90:
      return {
        messageType: data2 === 0 ? "noteoff" : "noteon",
        channel,
        noteNumber: data1,
        velocity: data2 / 127,
      };
    case 0xb0:
      return {
        messageType: "control",
        channel,
        controlNumber: data1,
        value: data2,
      };
    default:
      return {
        messageType: "unknown",
        channel,
      };
  }
};
