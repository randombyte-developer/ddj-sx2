import { LedButton } from "./controls/LedButton";
import { Deck } from "./Deck";

const seratoHeartbeat = [0xF0, 0x00, 0x20, 0x7F, 0x50, 0x01, 0xF7];

export function init(): void {
    // serato heartbeat to keep some additional functionality like jog wheel touch events
    engine.beginTimer(250, function() {
        midi.sendSysexMsg(seratoHeartbeat, seratoHeartbeat.length);
    }, false);
}

const decks = [1, 2, 3, 4].map(channel => new Deck(channel));

export function midiInput(channel: number, midiNo: number, value: number, status: number, group: string): void {
    engine.log(`Input{status: ${status}, midiNo: ${midiNo}}`);

    for (const deck of decks) {
        for (const control of deck.controls) {
            if (status === control.status && midiNo === control.midiNo) {
                control.offerValue(value);
            }
        }
    }
}
