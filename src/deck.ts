import { MidiControl } from "@controls/midiControl";
import { DeckMidiControl } from "@controls/deckMidiControl";
import { DeckLedButton } from "@controls/deckLedButton";
import { Button } from "@controls/button";

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
            new DeckMidiControl(Deck.potiBase, channel, 0x13, {
                onValueChanged: value => {
                    this.setParameter("volume", value / 0xFF);
                }
            }),
            new DeckMidiControl(Deck.potiBase, channel, 0x00, {
                onValueChanged: value => {
                    this.setParameter("rate", value / 0xFF);
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
