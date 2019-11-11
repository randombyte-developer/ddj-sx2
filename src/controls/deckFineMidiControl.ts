import { FineMidiControl } from "@controls/fineMidiControl";
import { MidiControlCallback } from "@controls/midiControl";

export class DeckFineMidiControl extends FineMidiControl {
    constructor(baseStatus: number, channel: number, midiNoMsb: number, midiNoLsb: number, callback: MidiControlCallback) {
        super(baseStatus + channel - 1, midiNoMsb, midiNoLsb, callback);
    }
}
