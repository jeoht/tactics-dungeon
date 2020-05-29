const soundUrls = {
    footstep: '/audio/footstep01.ogg'
}

export type Soundboard = Record<keyof typeof soundUrls, HTMLAudioElement>

export async function loadSounds(): Promise<Soundboard> {
    return new Promise((resolve, reject) => {
        const sounds: { [key: string]: HTMLAudioElement } = {}
        for (const [key, value] of Object.entries(soundUrls)) {
            const audio = new Audio()
            audio.addEventListener('canplaythrough', onload)
            audio.src = value
            audio.volume = 0.5
            sounds[key] = audio
        }

        const toLoad = Object.keys(soundUrls).length
        let loadedSounds = 0
        function onload() {
            loadedSounds += 1
            if (loadedSounds === toLoad) {
                resolve(sounds as Soundboard)
            }
        }
    })
}