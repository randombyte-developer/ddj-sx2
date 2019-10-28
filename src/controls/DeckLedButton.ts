import { ButtonCallback } from "./Button";
import { LedButton } from "./LedButton";

export class DeckLedButton extends LedButton {
    constructor(channel: number, midiNo: number, callback: ButtonCallback) {
        super(0x90 + channel - 1, midiNo, callback);
    }
}
