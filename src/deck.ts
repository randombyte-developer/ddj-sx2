import { MidiControl } from "@controls/midiControl";
import { DeckMidiControl } from "@controls/deckMidiControl";
import { DeckFineMidiControl } from "@controls/deckFineMidiControl";
import { DeckLedButton } from "@controls/deckLedButton";
import { Button } from "@controls/button";
import { log } from "@/utils";

export class Deck {

    private static buttonBase = 0x90;
    private static potiBase = 0xB0;

    public readonly controls: MidiControl[];

    constructor(readonly channel: number) {
        this.controls = [
            new DeckLedButton(Deck.buttonBase, channel, 0x0B, {
                onPressed: () => {
                    this.toggleControl("play");
                }
            }),
            new DeckLedButton(Deck.buttonBase, channel, 0x58, {
                onPressed: () => {
                    this.activate("beatsync");
                }
            }),
            new DeckFineMidiControl(Deck.potiBase, channel, 0x13, 0x33, {
                onValueChanged: value => {
                    this.setParameter("volume", value);
                }
            }),
            new DeckFineMidiControl(Deck.potiBase, channel, 0x00, 0x20, {
                onValueChanged: value => {
                    this.setParameter("rate", 1 - value);
                }
            })
        ];
    }

    private setParameter(key: string, value: number) {
        engine.setParameter(`[Channel${this.channel}]`, key, value);
    }

    private getValue(key: string): number {
        return engine.getValue(`[Channel${this.channel}]`, key);
    }

    private setValue(key: string, value: number) {
        engine.setValue(`[Channel${this.channel}]`, key, value);
    }

    private activate(key: string) {
        this.setValue(key, 1);
    }

    private toggleControl(key: string) {
        this.setValue(key, !(this.getValue(key) as any as boolean) as any as number);
    }
}
