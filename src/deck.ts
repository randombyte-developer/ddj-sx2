import { MidiControl } from "@controls/midiControl";
import { DeckLedButton } from "@controls/deckLedButton";

export class Deck {

    public readonly controls: MidiControl[];

    constructor(readonly channel: number) {
        this.controls = [
            // play/pause
            new DeckLedButton(channel, 0x0B, {
                onPressed: () => {
                    this.toggelControl("play");
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

    private toggelControl(key: string) {
        this.setValue(key, !(this.getValue(key) as any as boolean) as any as number);
    }
}
