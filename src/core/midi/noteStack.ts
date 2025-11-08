/**
 * NoteStack manages overlapping MIDI notes (e.g., sustain pedal scenarios)
 *
 * When multiple note-on events occur for the same MIDI note number before
 * note-off events, we need to track which note-on corresponds to which note-off.
 * This class implements a LIFO (Last In, First Out) stack for each note number.
 */

interface ActiveNote {
  noteId: string;
  channel: number;
}

export interface DrainedNote {
  noteNumber: number;
  noteId: string;
  channel: number;
}

export class NoteStack {
  private stacks: Map<number, ActiveNote[]> = new Map();

  /**
   * Push a note onto the stack for a given note number
   * @param noteNumber - MIDI note number (0-127)
   * @param noteId - Unique identifier for this note instance
   * @param channel - MIDI channel (0-15)
   */
  push(noteNumber: number, noteId: string, channel: number): void {
    const stack = this.stacks.get(noteNumber) ?? [];
    stack.push({ noteId, channel });
    this.stacks.set(noteNumber, stack);
  }

  /**
   * Pop the most recent note from the stack for a given note number
   * @param noteNumber - MIDI note number (0-127)
   * @returns The most recent active note, or null if stack is empty
   */
  pop(noteNumber: number): ActiveNote | null {
    const stack = this.stacks.get(noteNumber);
    if (!stack || stack.length === 0) {
      return null;
    }

    const active = stack.pop();
    if (!active) {
      this.stacks.delete(noteNumber);
      return null;
    }

    // Clean up empty stacks
    if (stack.length === 0) {
      this.stacks.delete(noteNumber);
    } else {
      this.stacks.set(noteNumber, stack);
    }

    return active;
  }

  /**
   * Check if there are any active notes for a given note number
   * @param noteNumber - MIDI note number (0-127)
   * @returns true if there are active notes, false otherwise
   */
  hasActiveNotes(noteNumber: number): boolean {
    const stack = this.stacks.get(noteNumber);
    return stack !== undefined && stack.length > 0;
  }

  /**
   * Clear all active notes
   */
  clear(): void {
    this.stacks.clear();
  }

  /**
   * Drain all active notes, clearing the internal stacks and returning the released notes
   */
  drain(): DrainedNote[] {
    const drained: DrainedNote[] = [];

    this.stacks.forEach((stack, noteNumber) => {
      while (stack.length > 0) {
        const note = stack.pop();
        if (!note) {
          break;
        }
        drained.push({ noteNumber, noteId: note.noteId, channel: note.channel });
      }
    });

    this.stacks.clear();
    return drained;
  }

  /**
   * Get the count of active notes for a given note number
   * @param noteNumber - MIDI note number (0-127)
   * @returns Number of active notes for this note number
   */
  getCount(noteNumber: number): number {
    return this.stacks.get(noteNumber)?.length ?? 0;
  }

  /**
   * Get all active note numbers
   * @returns Array of MIDI note numbers that have active notes
   */
  getActiveNoteNumbers(): number[] {
    return Array.from(this.stacks.keys());
  }
}
