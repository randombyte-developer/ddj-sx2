import { Button, ButtonCallback } from "@controls/button";

export class LedButton extends Button {
    constructor(status: number, midiNo: number, callback: ButtonCallback) {
        super(status, midiNo, callback);
    }

    public led(activate: boolean) {
        midi.sendShortMsg(this.status, this.midiNo, activate ? 0xFF : 0x00);
    }

    public ledOn() { this.led(true); }
    public ledOff() { this.led(false); }
}
