export class MidiControl {

    public lastValue: number = 0;

    constructor(readonly status: number, readonly midiNo: number, protected readonly callback: MidiControlCallback) {}

    public offerValue(status: number, midiNo: number, value: number) {
        if (status !== this.status || midiNo !== this.midiNo) return;

        if (this.callback.onNewValue) this.callback.onNewValue(value);

        if (this.lastValue === value) return;

        if (this.callback.onValueChanged) this.callback.onValueChanged(value);
        this.lastValue = value;
    }
}

export interface MidiControlCallback {
    onNewValue?(value: number): void;
    onValueChanged?(value: number): void;
}
