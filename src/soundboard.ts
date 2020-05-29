import _ = require("lodash")

const soundUrls = {
    footstep: '/audio/footstep01.ogg',
    selectUnit: '/audio/click_001.ogg',
    dropUnit: '/audio/drop_002.ogg'
}

export class Sound {
    gainNode: GainNode
    constructor(readonly context: AudioContext, readonly buffer: AudioBuffer) {
        const gainNode = context.createGain()
        gainNode.gain.value = 0.5
        gainNode.connect(context.destination)
        this.gainNode = gainNode
    }

    play() {
        const source = this.context.createBufferSource()
        source.buffer = this.buffer
        source.connect(this.gainNode)
        source.start()
    }
}

export type Soundboard = Record<keyof typeof soundUrls, Sound>

export async function loadSounds(): Promise<Soundboard> {
    const context = new AudioContext()


    return new Promise((resolve, reject) => {
        const sounds: { [key: string]: Sound } = {}
        for (const [key, url] of Object.entries(soundUrls)) {
            const request = new XMLHttpRequest()
            request.open('GET', url, true)
            request.responseType = 'arraybuffer'

            request.onload = () => {
                context.decodeAudioData(request.response, buffer => {
                    sounds[key] = new Sound(context, buffer)
                    if (_.size(sounds) === _.size(soundUrls)) {
                        resolve(sounds as Soundboard)
                    }
                })
            }
            request.send();
        }
    })
}