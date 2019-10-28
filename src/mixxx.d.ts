interface Engine {
    log(msg: string): void
    beginTimer(millis: number, func: () => void, oneShot: boolean): number
    getParameter(group: string, key: string): number
    setParameter(group: string, key: string, value: number): void
    getValue(group: string, key: string): number
    setValue(group: string, key: string, value: number): void
}

declare const engine: Engine

interface Midi {
    sendShortMsg(status: number, data1: number, data2: number): void
    sendSysexMsg(data: number[], length: number): void
}

declare const midi: Midi

declare function print(msg: string): void
