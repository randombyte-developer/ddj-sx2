import { ButtonCallback } from "@controls/button";
import { LedButton } from "@controls/ledButton";
import { DeckButton } from "./deckButton";

export class DeckLedButton extends LedButton {
    constructor(channel: number, midiNo: number, callback: ButtonCallback) {
        const status = DeckButton.BUTTON_BASE + channel - 1;

        super(status, midiNo, {
            onPressed: () => {
                if (callback.onPressed) callback.onPressed();
                midi.sendShortMsg(status, midiNo, 0x7F);
            },
            onReleased: () => {
                if (callback.onReleased) callback.onReleased();
                midi.sendShortMsg(status, midiNo, 0x00);
            }
        });
    }
}
