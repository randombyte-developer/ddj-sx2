export function log(msg: any) {
    engine.log(`AADDJ-SX2-LOG: ${msg}`);
}

export function toggleControl(channel: string, key: string) {
    engine.setValue(channel, key, !(engine.getValue(channel, key) as any as boolean) as any as number); // todo: casting
}

export function activate(channel: string, key: string) {
    engine.setValue(channel, key, 1);
}

export function makeLedConnection(channel: string, key: string, midiLedStatus: number, midiLedNo: number) {
    engine.makeConnection(channel, key, value => {
        midi.sendShortMsg(midiLedStatus, midiLedNo, value * 0x7F);
    });
}
