"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MidiAccessState, MidiDeviceInfo } from "@/core/midi/types";

interface MidiAccessResult {
  state: MidiAccessState;
  inputs: MidiDeviceInfo[];
  outputs: MidiDeviceInfo[];
  requestAccess: () => Promise<void>;
  midiAccess: MIDIAccess | null;
  error?: string;
}

const mapPortToDeviceInfo = (port: MIDIPort, type: "input" | "output"): MidiDeviceInfo => ({
  id: port.id,
  name: port.name ?? "Unknown Device",
  manufacturer: port.manufacturer ?? undefined,
  type,
  state: port.connection,
});

const extractDevices = (access: MIDIAccess) => {
  const inputs: MidiDeviceInfo[] = [];
  const outputs: MidiDeviceInfo[] = [];

  access.inputs.forEach((port) => {
    inputs.push(mapPortToDeviceInfo(port, "input"));
  });

  access.outputs.forEach((port) => {
    outputs.push(mapPortToDeviceInfo(port, "output"));
  });

  return { inputs, outputs };
};

export const useMidiAccess = (): MidiAccessResult => {
  const [access, setAccess] = useState<MIDIAccess | null>(null);
  const [inputs, setInputs] = useState<MidiDeviceInfo[]>([]);
  const [outputs, setOutputs] = useState<MidiDeviceInfo[]>([]);
  const [state, setState] = useState<MidiAccessState>("initial");
  const [error, setError] = useState<string | undefined>(undefined);
  const requestedRef = useRef(false);

  const requestAccess = useCallback(async () => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      setState("error");
      setError("Web MIDI API is not supported in this browser.");
      return;
    }

    try {
      setState("requesting");
      const midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      setAccess(midiAccess);
      setState("granted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error requesting MIDI access.";
      setError(message);
      setState(message.includes("permission") ? "denied" : "error");
    }
  }, []);

  // When access changes, sync devices and subscribe to changes
  useEffect(() => {
    if (!access) return;

    const extract = () => {
      const devices = extractDevices(access);
      setInputs(devices.inputs);
      setOutputs(devices.outputs);
    };

    extract(); // initial snapshot
    access.onstatechange = extract;

    return () => {
      access.onstatechange = null;
    };
  }, [access]);

  return useMemo(
    () => ({
      state,
      inputs,
      outputs,
      error,
      requestAccess,
      midiAccess: access,
    }),
    [access, inputs, outputs, requestAccess, state, error],
  );
};
