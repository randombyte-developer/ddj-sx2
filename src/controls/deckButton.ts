import { Button, ButtonCallback } from "@controls/button";

export class DeckButton extends Button {
    public static readonly BUTTON_BASE = 0x90;

    constructor(channel: number, midiNo: number, callback: ButtonCallback) {
        super(DeckButton.BUTTON_BASE + channel - 1, midiNo, callback);
    }
}
