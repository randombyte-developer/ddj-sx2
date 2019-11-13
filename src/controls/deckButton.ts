import { Button, ButtonCallback } from "@controls/button";

export class DeckButton extends Button {
    constructor(baseStatus: number, channel: number, midiNo: number, callback: ButtonCallback) {
        super(baseStatus + channel - 1, midiNo, callback);
    }
}
