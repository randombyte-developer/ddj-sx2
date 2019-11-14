import { MidiControl, MidiControlCallback } from "@controls/midiControl";

export class FineMidiControl extends MidiControl {

    private lastValueMsb: number = 0;
    private lastValueLsb: number = 0;

    constructor(status: number, readonly midiNoMsb: number, readonly midiNoLsb: number,
                callback: MidiControlCallback) {
        super(status, -1, callback);
    }

    public offerValue(status: number, midiNo: number, value: number) {
        if (status !== this.status) return;

        if (midiNo === this.midiNoMsb) {
            // tslint:disable-next-line: no-bitwise
            const fullValue = ((value << 7) + this.lastValueLsb) / 0x3FFF;

            if (this.callback.onValueChanged) this.callback.onValueChanged(fullValue);

            this.lastValue = fullValue;
            this.lastValueMsb = value;
        } else if (midiNo === this.midiNoLsb) {
            // tslint:disable-next-line: no-bitwise
            const fullValue = ((this.lastValueMsb << 7) + value) / 0x3FFF;

            if (this.callback.onValueChanged) this.callback.onValueChanged(fullValue);

            this.lastValue = fullValue;
            this.lastValueLsb = value;
        }
    }
}
