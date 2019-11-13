import { ButtonCallback } from "@controls/button";
import { LedButton } from "@controls/ledButton";
import { DeckButton } from "./deckButton";

export class DeckLedButton extends LedButton {
    constructor(channel: number, midiNo: number, callback: ButtonCallback) {
        super(DeckButton.BUTTON_BASE + channel - 1, midiNo, callback);
    }
}
