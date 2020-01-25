import { Button } from "@controls/button";
import { Deck } from "@/deck";
import { FineMidiControl } from "@controls/fineMidiControl";
import { log, toggleControl, activate, makeLedConnection } from "@/utils";
import { MidiControl } from "./controls/midiControl";

const requestControlsSysex = [0xF0, 0x00, 0x20, 0x7F, 0x03, 0x01, 0xF7];

const decks = [1, 2, 3, 4].map(channel => new Deck(channel));
let deckIndependentControls: MidiControl[];

export function init(): void {

    deckIndependentControls = [
        new FineMidiControl(0xB6, 0x1F, 0x3F, {
            onValueChanged: value => {
                engine.setParameter("[Master]", "crossfader", value);
            }
        }),
        new Button(0x96, 0x63, {
            onPressed: () => {
                //toggleControl("[Master]", "headSplit");
            }
        }),
        new Button(0x96, 0x41, {
            onPressed: () => {
                activate("[Library]", "MoveFocusForward");
            }
        }),
        new Button(0x96, 0x65, {
            onPressed: () => {
                activate("[Library]", "MoveLeft");
            }
        }),
        new Button(0x96, 0x67, {
            onPressed: () => {
                activate("[Library]", "MoveRight");
            }
        })
    ];

    function traxControl(midiNo: number, factor: number): MidiControl {
        return new MidiControl(0xB6, midiNo, {
            onNewValue: value => {
                if (value > 0x3F) value = value - 0x80;
                engine.setValue("[Library]", "MoveVertical", value * factor);
            }
        });
    }
    deckIndependentControls.push(traxControl(0x40, 1));
    deckIndependentControls.push(traxControl(0x64, 5));

    // Effects
    for (const effectUnit of [1, 2]) {
        for (const effectNumber of [1, 2, 3]) {
            const group = `[EffectRack1_EffectUnit${effectUnit}_Effect${effectNumber}]`;

            deckIndependentControls.push(new FineMidiControl(0xB3 + effectUnit, 0x00 + (effectNumber * 2), 0x20 + (effectNumber * 2), {
                onValueChanged: value => {
                    engine.setParameter(group, "meta", value);
                }
            }));
            deckIndependentControls.push(new Button(0x93 + effectUnit, 0x46 + effectNumber, {
                onPressed: () => {
                    toggleControl(group, "enabled");
                }
            }));

            makeLedConnection(group, "enabled", 0x93 + effectUnit, 0x46 + effectNumber);
        }
    }

    //makeLedConnection("[Master]", "headSplit", 0x96, 0x63);

    midi.sendSysexMsg(requestControlsSysex, requestControlsSysex.length);
}

export function midiInput(channel: number, midiNo: number, value: number, status: number, group: string): void {
    log(`Input{status: ${status.toString(16)}, midiNo: ${midiNo.toString(16)}, value: ${value.toString(16)}}`);

    for (const deck of decks) {
        for (const control of deck.controls) {
            control.offerValue(status, midiNo, value);
        }
    }

    for (const control of deckIndependentControls) {
        control.offerValue(status, midiNo, value);
    }
}
