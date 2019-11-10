export class MidiControl {

    public lastValue: number = 0;

    constructor(readonly status: number, readonly midiNo: number, protected readonly callback: MidiControlCallback) {}

    public offerValue(value: number) {
        if (this.lastValue !== value) {
            if (this.callback.onValueChanged) this.callback.onValueChanged(value);
            this.lastValue = value;
        }
    }
}

export interface MidiControlCallback {
    onValueChanged?(value: number): void;
}
