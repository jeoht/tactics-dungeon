import _ = require("lodash")

const musicUrls = {
    floor: "/music/airtone_-_reNovation.mp3"
}

export class Track {
    gainNode: GainNode
    constructor(readonly context: AudioContext, readonly audio: HTMLAudioElement) {
        const gainNode = context.createGain()
        gainNode.gain.value = 0.5
        gainNode.connect(context.destination)
        this.gainNode = gainNode
    }

    play() {
        const source = this.context.createMediaElementSource(this.audio);
        source.connect(this.gainNode)
        this.audio.loop = true
        this.audio.play()
    }
}

export type MusicTracks = Record<keyof typeof musicUrls, Track>

export async function loadMusic(): Promise<MusicTracks> {
    const context = new AudioContext()

    return new Promise((resolve, reject) => {
        const tracks: { [key: string]: Track } = {}
        for (const [key, url] of Object.entries(musicUrls)) {
            const audio = new Audio()
            audio.src = url
            tracks[key] = new Track(context, audio)
        }
        resolve(tracks as MusicTracks)
    })
}