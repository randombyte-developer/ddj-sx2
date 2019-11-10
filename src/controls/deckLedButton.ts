import { ButtonCallback } from "@controls/button";
import { LedButton } from "@controls/ledButton";

export class DeckLedButton extends LedButton {
    constructor(baseStatus: number, channel: number, midiNo: number, callback: ButtonCallback) {
        super(baseStatus + channel - 1, midiNo, callback);
    }
}
