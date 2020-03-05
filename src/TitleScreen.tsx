import React = require("react")
import { action } from "mobx"

import { GameContext } from "./GameView"
import { CELL_WIDTH, CELL_HEIGHT, BOARD_COLS, TILESET_BIOME_COLS } from "./settings"

function TitleScreenBG() {
    const { game } = React.useContext(GameContext)
    const ref = React.createRef<HTMLCanvasElement>()    

    React.useEffect(() => {
        if (!ref.current) return

        const canvas = ref.current
        const ctx = canvas.getContext("2d")!


        const onResize = () => {
            const styleWidth = canvas.offsetWidth
            const styleHeight = canvas.offsetHeight
            const scale = window.devicePixelRatio
    
            const width = BOARD_COLS * CELL_WIDTH
            canvas.width = width * scale
            canvas.height = styleHeight

            ctx.scale(scale, scale)
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            const boardWidth = canvas.width / CELL_WIDTH
            const boardHeight = canvas.height / CELL_HEIGHT

            function randomTile() {
                return TILESET_BIOME_COLS*0 + 3 + Math.floor(Math.random()*3)
            }
            
            for (let x = 0; x < boardWidth; x++) {
                for (let y = 0; y < boardHeight; y++) {
                    const sx = x*CELL_WIDTH
                    const sy = y*CELL_HEIGHT
                    game.ui.assets.world.drawTile(ctx, randomTile(), sx, sy, CELL_WIDTH, CELL_HEIGHT)
                }
            } 
        }

        onResize()
    })

    return <canvas ref={ref} className="background"/>
}

export function TitleScreen() {
    const { game } = React.useContext(GameContext)

    const newGame = action(() => {
        game.ui.state = { type: 'board' }
    })

    return <div className="TitleScreen">
        <TitleScreenBG/>
        <h1>
            <div className="tactics">Tactics</div>
            <div className="dungeon">Dungeon</div>
        </h1>
        <ul>
            <li>Continue</li>
            <li onTouchEnd={newGame}>New Game</li>
            <li>Settings</li>
        </ul>
    </div>
}