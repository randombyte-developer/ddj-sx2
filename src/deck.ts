import { MidiControl } from "@controls/midiControl";
import { DeckMidiControl } from "@controls/deckMidiControl";
import { DeckFineMidiControl } from "@controls/deckFineMidiControl";
import { DeckLedButton } from "@controls/deckLedButton";
import { DeckButton } from "@controls/deckButton";
import { log, toggleControl, makeLedConnection } from "@/utils";
import { FineMidiControl } from "@/controls/fineMidiControl";
import { Button } from "@/controls/button";

export class Deck {

    private static potiBase = 0xB0;

    public readonly controls: MidiControl[];
    private readonly group: string;

    constructor(readonly channel: number) {
        this.group = `[Channel${channel}]`;

        this.controls = [
            new DeckLedButton(channel, 0x0B, {
                onPressed: () => {
                    this.toggleControl("play");
                }
            }),
            new DeckButton(channel, 0x58, {
                onPressed: () => {
                    this.activate("beatsync");
                }
            }),
            new DeckButton(channel, 0x54, {
                onPressed: () => {
                    this.toggleControl("pfl");
                }
            }),
            new DeckButton(channel, 0x16, {
                onPressed: () => {
                    this.setValue("orientation", 0);
                }
            }),
            new DeckButton(channel, 0x1D, {
                onPressed: () => {
                    this.setValue("orientation", 1);
                }
            }),
            new DeckButton(channel, 0x18, {
                onPressed: () => {
                    this.setValue("orientation", 2);
                }
            }),

            // EQ
            new DeckFineMidiControl(channel, Deck.potiBase, 0x0F, 0x2F, {
                onValueChanged: value => {
                    engine.setParameter(`[EqualizerRack1_${this.group}_Effect1]`, "parameter1", value);
                }
            }),
            new DeckFineMidiControl(channel, Deck.potiBase, 0x0B, 0x2B, {
                onValueChanged: value => {
                    engine.setParameter(`[EqualizerRack1_${this.group}_Effect1]`, "parameter2", value);
                }
            }),
            new DeckFineMidiControl(channel, Deck.potiBase, 0x07, 0x27, {
                onValueChanged: value => {
                    engine.setParameter(`[EqualizerRack1_${this.group}_Effect1]`, "parameter3", value);
                }
            }),

            // Quick Effect / Filter
            new FineMidiControl(0xB6, 0x16 + channel, 0x36 + channel, {
                onValueChanged: value => {
                    engine.setParameter(`[QuickEffectRack1_${this.group}]`, "super1", value);
                }
            }),
            new Button(0x96, 0x73 + channel, {
                onValueChanged: value => {
                    engine.setValue(`[QuickEffectRack1_${this.group}]`, "enabled", value > 0);
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

        this.makeLedConnection("play", 0x0B);
        this.makeLedConnection("beatsync", 0x58);
        this.makeLedConnection("pfl", 0x54);
    }

    private setParameter(key: string, value: number) {
        engine.setParameter(this.group, key, value);
    }

    private getValue(key: string): number {
        return engine.getValue(this.group, key);
    }

    private setValue(key: string, value: number) {
        engine.setValue(this.group, key, value);
    }

    private activate(key: string) {
        this.setValue(key, 1);
    }

    private toggleControl(key: string) {
        toggleControl(this.group, key);
    }

    private makeLedConnection(key: string, midiLedNo: number) {
        makeLedConnection(this.group, key, DeckButton.BUTTON_BASE + this.channel - 1, midiLedNo);
    }
}
