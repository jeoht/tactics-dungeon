import React = require("react")
import { action } from "mobx"

import { GameContext } from "./GameView"
import { CELL_WIDTH, CELL_HEIGHT, BOARD_COLS, TILESET_BIOME_COLS } from "./settings"
import { useContext } from "react"

function TitleScreenBG() {
    const { game } = useContext(GameContext)
    const ref = React.createRef<HTMLCanvasElement>()    

    React.useEffect(() => {
        if (!ref.current) return

        const canvas = ref.current
        const ctx = canvas.getContext("2d")!


        const onResize = () => {
            const styleWidth = canvas.parentElement!.offsetWidth
            const styleHeight = canvas.parentElement!.offsetHeight
            const scale = window.devicePixelRatio
    
            const boardWidth = 6
            canvas.width = boardWidth * CELL_WIDTH * scale


            const boardHeight = Math.ceil(styleHeight / (CELL_HEIGHT*scale)) * (canvas.width/styleWidth)
            canvas.height = boardHeight * CELL_HEIGHT * scale

            ctx.scale(scale, scale)
            ctx.clearRect(0, 0, canvas.width, canvas.height)

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

        window.addEventListener("resize", onResize)
        onResize()

        return () => window.removeEventListener("resize", onResize)
    })

    return <div className="background">
        <canvas ref={ref} />
    </div>
}

export function TitleScreen() {
    const { world, ui } = useContext(GameContext)

    const newGame = action(() => {
        world.newGame()
        ui.goto('board')
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