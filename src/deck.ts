import { MidiControl } from "@controls/midiControl";
import { DeckMidiControl } from "@controls/deckMidiControl";
import { DeckFineMidiControl } from "@controls/deckFineMidiControl";
import { DeckLedButton } from "@controls/deckLedButton";
import { LedButton } from "@controls/ledButton";
import { DeckButton } from "@controls/deckButton";
import { log, toggleControl, activate, makeLedConnection, clamp } from "@/utils";
import { FineMidiControl } from "@/controls/fineMidiControl";
import { Button } from "@/controls/button";

export class Deck {

    private static potiBase = 0xB0;
    private static jogWheelCenter = 0x40;

    private static padOffset = 0x07;
    private static padShiftOffset = 0x08;

    private static hotcueGreen = 0x1A;
    private static hotcueDeleteRed = 0x28;
    private static beatjumpOrange = 0x27;
    private static instantFilterEffectOrange = 0x27;
    private static eqKillBlue = 0x08;
    private static beatlooprollPurple = 0x2E;

    private static partnerDecks = [2, 1, 4, 3];

    public readonly controls: MidiControl[];
    private readonly connections: Connection[] = [];
    private readonly group: string;

    private readonly rateControl: DeckFineMidiControl;
    private readonly deckStatus: number;

    private readonly ejectMidiNo: number;

    private previousBeatloopSize: number = 8;

    constructor(readonly channel: number) {
        this.group = `[Channel${channel}]`;

        this.deckStatus = DeckButton.BUTTON_BASE + this.channel - 1;
        this.ejectMidiNo = 0x57 + channel + (channel >= 3 ? 6 : 0); // 0x58, 0x59, 0x60, 0x61

        const padStatus = channel + Deck.padOffset;
        const padLedStatus = padStatus - 1;
        const padLedStatusWithBase = padLedStatus + DeckButton.BUTTON_BASE;

        const eqGroup = `[EqualizerRack1_${this.group}_Effect1]`;
        const filterEffectGroup = `[QuickEffectRack1_${this.group}]`;

        this.controls = [
            new DeckButton(channel, 0x0B, {
                onPressed: () => {
                    this.toggleControl("play");
                }
            }),
            new DeckButton(channel, 0x48, {
                onPressed: () => {
                    this.activate("start");
                }
            }),
            new DeckLedButton(channel, 0x58, {
                onPressed: () => {
                    this.activate("beatsync");
                    this.updateRateTakeoverLeds();
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

            // Loops
            new DeckButton(channel, 0x14, {
                onPressed: () => {
                    this.activate(`beatloop_${this.getValue("beatloop_size")}_toggle`);
                }
            }),
            new DeckLedButton(channel, 0x12, {
                onPressed: () => {
                    this.activate("loop_halve");
                }
            }),
            new DeckLedButton(channel, 0x13, {
                onPressed: () => {
                    this.activate("loop_double");
                }
            }),

            // EQ
            new DeckFineMidiControl(channel, Deck.potiBase, 0x0F, 0x2F, {
                onValueChanged: value => {
                    engine.setParameter(eqGroup, "parameter1", value);
                }
            }),
            new DeckFineMidiControl(channel, Deck.potiBase, 0x0B, 0x2B, {
                onValueChanged: value => {
                    engine.setParameter(eqGroup, "parameter2", value);
                }
            }),
            new DeckFineMidiControl(channel, Deck.potiBase, 0x07, 0x27, {
                onValueChanged: value => {
                    engine.setParameter(eqGroup, "parameter3", value);
                }
            }),

            // Quick Effect / Filter
            new FineMidiControl(0xB6, 0x16 + channel, 0x36 + channel, {
                onValueChanged: value => {
                    engine.setParameter(filterEffectGroup, "super1", value);
                }
            }),

            new DeckFineMidiControl(Deck.potiBase, channel, 0x04, 0x24, {
                onValueChanged: value => {
                    this.setParameter("pregain", value);
                }
            }),
            new DeckFineMidiControl(Deck.potiBase, channel, 0x13, 0x33, {
                onValueChanged: value => {
                    this.setParameter("volume", value);
                }
            }),

            new DeckButton(channel, 0x1A, {
                onPressed: () => {
                    this.toggleControl("quantize");
                }
            }),

            // Beatjump
            new DeckButton(channel + Deck.padOffset, 0x06, {
                onPressed: () => {
                    this.activate("beatjump_backward");
                }
            }),
            new DeckButton(channel + Deck.padOffset, 0x07, {
                onPressed: () => {
                    this.activate("beatjump_forward");
                }
            }),
            new DeckLedButton(channel, 0x24, {
                onPressed: () => {
                    this.modifyAndClampBeatjumpSize(0.5);
                }
            }),
            new DeckLedButton(channel, 0x2C, {
                onPressed: () => {
                  this.modifyAndClampBeatjumpSize(2);
                }
            })
        ];

        // Rate
        this.rateControl = new DeckFineMidiControl(Deck.potiBase, channel, 0x00, 0x20, {
            onValueChanged: value => {
                const hardwareValue = 1 - value;
                this.setParameter("rate", hardwareValue);
                this.updateRateTakeoverLeds(hardwareValue);
            }
        });
        this.controls.push(this.rateControl);

        // Jog wheel
        const jogWheelConfiguration = {
            touch: [0x36, 0x67],
            scratch: [0x22, 0x1F],
            bend: [0x21, 0x26],
            factor: [1, 20]
        };

        for (let i = 0; i < 2; i++) {
            this.controls.push(new DeckButton(channel, jogWheelConfiguration.touch[i], {
                onPressed: () => {
                    const alpha = 1.0 / 8;
                    const beta = alpha / 32;
                    engine.scratchEnable(channel, 1024, 33 + 1 / 3, alpha, beta, false);
                },
                onReleased: () => {
                    engine.scratchDisable(channel, false);
                }
            }));
            this.controls.push(new DeckMidiControl(channel, Deck.potiBase, jogWheelConfiguration.scratch[i], {
                onNewValue: value => {
                    engine.scratchTick(channel, (value - Deck.jogWheelCenter) * jogWheelConfiguration.factor[i]);
                }
            }));
            this.controls.push(new DeckMidiControl(channel, Deck.potiBase, jogWheelConfiguration.bend[i], {
                onNewValue: value => {
                    if (engine.isScratching(channel)) {
                        engine.scratchTick(channel, value - Deck.jogWheelCenter);
                    } else {
                        this.setParameter("jog", (value - Deck.jogWheelCenter) / 10.0);
                    }
                }
            }));
        }

        // Hotcues
        for (let hotcueIndex = 0; hotcueIndex < 4; hotcueIndex++) {
            const hotcueNumber = hotcueIndex + 1;
            const padMidiNo = 0x00 + hotcueIndex;
            const shiftedpadMidiNo = padMidiNo + Deck.padShiftOffset;

            this.controls.push(new DeckButton(padStatus, padMidiNo, {
                onValueChanged: pressed => {
                    this.setValue(`hotcue_${hotcueNumber}_activate`, pressed);
                }
            }));
            this.controls.push(new DeckButton(padStatus, shiftedpadMidiNo, {
                onPressed: () => {
                    this.activate(`hotcue_${hotcueNumber}_clear`);
                }
            }));

            this.makeConnection(`hotcue_${hotcueNumber}_enabled`, enabled => {
                midi.sendShortMsg(padLedStatusWithBase, padMidiNo, Deck.hotcueGreen * enabled);
                midi.sendShortMsg(padLedStatusWithBase, shiftedpadMidiNo, Deck.hotcueDeleteRed * enabled);
            });

            midi.sendShortMsg(padLedStatusWithBase, padMidiNo, Deck.hotcueGreen);
            midi.sendShortMsg(padLedStatusWithBase, shiftedpadMidiNo, Deck.hotcueDeleteRed);
        }

        // Load track
        this.controls.push(new Button(0x96, 0x45 + channel, {
            onPressed: () => {
                this.activate("LoadSelectedTrack");
            }
        }));
        midi.sendShortMsg(0x96, 0x45 + channel, 0x7F); // Init load leds

        // Eject track
        this.controls.push(new Button(0x96, this.ejectMidiNo, {
            onPressed: () => {
                if (!this.getValue("play")) this.activate("eject");
            }
        }));
        this.makeConnection("play", this.updateLoadTrackLed);
        this.makeConnection("track_loaded", this.updateLoadTrackLed);

        // EQ-Kill
        for (let i = 0; i < 3; i++) {
            const buttonParameter = `button_parameter${i + 1}`;
            const padMidiNo = 0x10 + i;
            this.controls.push(new DeckButton(padStatus, padMidiNo, {
                onValueChanged: pressed => {
                    engine.setValue(eqGroup, buttonParameter, pressed);
                }
            }));
            this.connections.push(engine.makeConnection(eqGroup, buttonParameter, enabled => {
                midi.sendShortMsg(padLedStatusWithBase, padMidiNo, Deck.eqKillBlue * +!enabled); // +boolean -> number
            }));

            midi.sendShortMsg(padLedStatusWithBase, padMidiNo, Deck.eqKillBlue);
        }

        // Instant Filter
        this.controls.push(new DeckButton(padStatus, 0x13, {
            onValueChanged: pressed => {
                pressed = pressed ? 1 : 0;
                engine.setParameter(filterEffectGroup, "super1", 0.5 - pressed / 4);
                midi.sendShortMsg(padLedStatusWithBase, 0x13, Deck.instantFilterEffectOrange * +!pressed);
            }
        }));
        midi.sendShortMsg(padLedStatusWithBase, 0x13, Deck.instantFilterEffectOrange);

        // Beatlooproll
        this.controls.push(new DeckButton(channel + Deck.padOffset, 0x14, {
            onPressed: () => {
                this.previousBeatloopSize = +this.getValue("beatloop_size");
            },
            onValueChanged: pressed => {
                this.setValue("beatlooproll_0.5_activate", pressed);
            }
        }));
        this.makeConnection("beatlooproll_0.5_activate", enabled => {
            midi.sendShortMsg(padLedStatusWithBase, 0x14, Deck.beatlooprollPurple * +!enabled);
            if (!enabled) {
                engine.beginTimer(1, () => {
                    log(this.previousBeatloopSize)
                    this.setValue("beatloop_size", this.previousBeatloopSize);
                }, true);
            }
        });
        midi.sendShortMsg(padLedStatusWithBase, 0x14, Deck.beatlooprollPurple);

        // SoftTakeover
        engine.softTakeover(this.group, "rate", true);
        // softTakeoverIgnoreNextValue when switching away from a deck
        this.controls.push(new DeckButton(channel, 0x72, {
            onPressed: () => {
                engine.softTakeoverIgnoreNextValue(`[Channel${Deck.partnerDecks[channel]}]`, "rate");
            }
        }));

        this.makeLedConnection("play", 0x0B);
        this.makeLedConnection("pfl", 0x54);
        this.makeLedConnection("quantize", 0x1A);
        this.makeLedConnection("loop_enabled", 0x14);

        this.initLeds();
        this.triggerConnections();
    }

    private triggerConnections() {
        for (const connection of this.connections) {
            connection.trigger();
        }
    }

    /**
     * Initializes only some Leds, others like hotcue pads are somewhere else.
     */
    private initLeds() {
        // hotcue master pad
        midi.sendShortMsg(this.deckStatus, 0x1B, Deck.hotcueGreen);

        const padLedStatusWithBase = this.deckStatus + Deck.padOffset;

        // beatjump pads
        for (let padIndex = 6; padIndex < 8; padIndex++) {
            midi.sendShortMsg(padLedStatusWithBase, 0x00 + padIndex, Deck.beatjumpOrange);
            midi.sendShortMsg(padLedStatusWithBase, 0x00 + padIndex + Deck.padShiftOffset, Deck.beatjumpOrange);
            midi.sendShortMsg(padLedStatusWithBase, 0x00 + padIndex + Deck.padShiftOffset, 0x00);
        }
    }

    private modifyAndClampBeatjumpSize(factor: number) {
        this.setValue("beatjump_size", clamp(this.getValue("beatjump_size") as number * factor, 0.03125, 128));
    }

    private updateRateTakeoverLeds(hardwareValue: number = 1 - this.rateControl.lastValue) {
        const softwareValue = this.getParameter("rate");
        log(`${hardwareValue} ${softwareValue}`)
        midi.sendShortMsg(this.deckStatus, 0x37, +(hardwareValue < softwareValue));
        midi.sendShortMsg(this.deckStatus, 0x34, +(hardwareValue > softwareValue));
    }

    private updateLoadTrackLed() {
        midi.sendShortMsg(0x96, this.ejectMidiNo, +!this.getValue("play") * +this.getValue("track_loaded") * 0x7F);
    }

    private getParameter(key: string): number {
        return engine.getParameter(this.group, key);
    }

    private setParameter(key: string, value: number) {
        engine.setParameter(this.group, key, value);
    }

    private getValue(key: string): number | boolean {
        return engine.getValue(this.group, key);
    }

    private setValue(key: string, value: number | boolean) {
        engine.setValue(this.group, key, value);
    }

    private activate(key: string) {
        activate(this.group, key);
    }

    private toggleControl(key: string) {
        toggleControl(this.group, key);
    }

    private makeConnection(key: string, callback: ConnectionCallback) {
        this.connections.push(engine.makeConnection(this.group, key, callback));
    }

    private makeLedConnection(key: string, midiLedNo: number) {
        this.connections.push(makeLedConnection(this.group, key, this.deckStatus, midiLedNo));
    }
}
