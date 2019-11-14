import { Button, ButtonCallback } from "@controls/button";

export class LedButton extends Button {
    constructor(status: number, midiNo: number, callback: ButtonCallback) {
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
