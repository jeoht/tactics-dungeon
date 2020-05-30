import { CanvasBoard } from "./CanvasBoard"
import { FloorEvent } from "./Floor"
import { observable } from "mobx"
import { DamageText } from "./DamageText"
import { Team } from "./Unit"

/**
 * Responsible for playing the sequence of animations that represents a series of FloorEvents
 */
export class EventPlayer {
    board: CanvasBoard
    @observable eventsPlayed: number = 0
    inProgress: boolean = false

    constructor(board: CanvasBoard) {
        this.board = board
    }

    /**
     * Play through all new events
     */
    async playAll() {
        const { eventLog } = this.board.floor
        if (this.inProgress || this.eventsPlayed >= eventLog.length) return

        while (eventLog.length > this.eventsPlayed) {
            this.inProgress = true

            try {
                const event = eventLog[this.eventsPlayed]
                await this.play(event)
            } finally {
                this.inProgress = false
                this.eventsPlayed += 1
            }
        }
    }

    async play(event: FloorEvent) {
        const { board } = this
        const { ui } = this.board
        if (event.type === 'pathMove') {
            const { unit, fromCell, path } = event
            const sprite = board.get(unit)
            if (unit.isPlayerTeam) {
                // Instant move for player
                sprite.pos = board.get(path[path.length - 1]).pos
            } else {
                ui.sounds.footstep.play()
                await sprite.animatePathMove(fromCell, path)
            }
        } else if (event.type === 'teleport') {
            const { unit, toCell } = event
            const sprite = board.get(unit)
            sprite.pos = board.get(toCell).pos
            board.mlog(event)
        } else if (event.type === 'attack') {
            const damageText = new DamageText(board, event.damage, board.get(event.target.cell).pos)
            board.damageTexts.push(damageText)
            await board.get(event.unit).attackAnimation(event)
            board.mlog(event)
        } else if (event.type === 'defeated') {
            const sprite = board.get(event.unit)
            await sprite.fadeOut()
            board.unitSprites = board.unitSprites.filter(o => o !== sprite)
            board.mlog(event)
        } else if (event.type === 'endMove') {
            board.get(event.unit).moved = true
        } else if (event.type === 'startPhase') {
            for (const sprite of board.unitSprites) {
                if (sprite.unit.team === event.team)
                    sprite.moved = false
            }

            if (event.team === Team.Player)
                ui.goto('board')
            else
                ui.goto('enemyPhase')
        } else if (event.type === 'floorCleared') {
            setTimeout(() => ui.goto('floorCleared'), 500)
        } else if (event.type === 'floorFailed') {
            setTimeout(() => ui.goto('titleScreen'), 500)
        } else {
            board.mlog(event)
        }
    }
}