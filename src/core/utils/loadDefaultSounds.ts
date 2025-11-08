import { GeneratedSound } from "@/core/stores/useSoundStore";

const DEFAULT_SOUNDS = [
  { file: "piano.mp3", name: "Piano" },
  { file: "ambient-pad.mp3", name: "Ambient Pad" },
  { file: "bell-1.mp3", name: "Bell 1" },
  { file: "guitar-string.mp3", name: "Guitar String" },
  { file: "guitar-string-2.mp3", name: "Guitar String 2" },
  { file: "key-2.mp3", name: "Key 2" },
  { file: "keyboard.mp3", name: "Keyboard" },
  { file: "moog-bass.mp3", name: "Moog Bass" },
  { file: "wavy-bell.mp3", name: "Wavy Bell" },
  { file: "wooden-marimba.mp3", name: "Wooden Marimba" },
  { file: "zither-string.mp3", name: "Zither String" },
];

export async function loadDefaultSounds(): Promise<GeneratedSound[]> {
  const sounds: GeneratedSound[] = [];

  for (const sound of DEFAULT_SOUNDS) {
    try {
      const response = await fetch(`/audio/${sound.file}`);
      if (!response.ok) continue;

      const audioBlob = await response.blob();

      sounds.push({
        id: `default-${sound.file}`,
        name: sound.name,
        description: `Default sound: ${sound.name}`,
        audioBlob,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error(`Failed to load ${sound.file}:`, error);
    }
  }

  return sounds;
}
