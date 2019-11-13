import { MidiControl, MidiControlCallback } from "@controls/midiControl";

export class Button extends MidiControl {
    constructor(status: number, midiNo: number, callback: ButtonCallback) {
        super(status, midiNo, {
            onValueChanged: (value: number) => {
                if (callback.onValueChanged)  callback.onValueChanged(value);
                if (value > 0) {
                    if (callback.onPressed) callback.onPressed();
                } else {
                    if (callback.onReleased) callback.onReleased();
                }
            }
        });
    }
}

export interface ButtonCallback extends MidiControlCallback {
    onPressed?(): void;
    onReleased?(): void;
}
