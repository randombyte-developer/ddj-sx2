export class MidiControl {

    public lastValue: number = 0;

    constructor(readonly status: number, readonly midiNo: number, protected readonly callback: MidiControlCallback) {}

    public offerValue(status: number, midiNo: number, value: number) {
        if (status !== this.status || midiNo !== this.midiNo || this.lastValue === value) return;

        if (this.callback.onValueChanged) this.callback.onValueChanged(value);
        this.lastValue = value;
    }
}

export interface MidiControlCallback {
    onValueChanged?(value: number): void;
}
