import { MidiControl, MidiControlCallback } from "@controls/midiControl";

export class DeckMidiControl extends MidiControl {
    constructor(baseStatus: number, channel: number, midiNo: number, callback: MidiControlCallback) {
        super(baseStatus + channel - 1, midiNo, callback);
    }
}
