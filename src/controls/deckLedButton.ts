import { ButtonCallback } from "@controls/button";
import { LedButton } from "@controls/ledButton";

export class DeckLedButton extends LedButton {
    constructor(channel: number, midiNo: number, callback: ButtonCallback) {
        super(0x90 + channel - 1, midiNo, callback);
    }
}
