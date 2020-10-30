import { useContext, useEffect } from "react"
import React = require("react")
import { PeepBadge } from "./PeepBadge"
import { FloorContext } from "./GameView"
import styled from "styled-components"
import { Overlay } from "./Overlay"
import { action, computed, observable } from "mobx"
import { Tickable } from "./TimeReactor"
import { useLocalStore, useObserver } from "mobx-react-lite"
import { UI } from "./UI"
import _ = require("lodash")
import { BobbleCreatureImage } from "./BobbleCreatureImg"
import { CreatureTileDefOf } from "./CreatureTileDef"


// First Minister of the Lich Republic
// The people of this great nation did not conquer death merely to face obliteration at the whim of some unelected council of gods.
// My constituents demand action and the government has a mandate to answer!

class TextRevealer implements Tickable {
    startTime: number
    @observable.ref revealedText: React.ReactNode
    msToReachChar: number[]

    constructor(readonly ui: UI, readonly fullText: React.ReactNode) {
        this.startTime = ui.time.now
        this.msToReachChar = mapCharactersToRevealTime(this.fullText)
        ui.time.add(this)
    }

    @action frame() {
        const timePassed = this.ui.time.now - this.startTime
        this.revealedText = mapCharacters(
            this.fullText,
            (ch, i) => {
                if (timePassed >= this.msToReachChar[i]) {
                    return <span key={`ch-${i}`}>{ch}</span>
                } else {
                    return <span key={`ch-${i}`} style={{ opacity: 0 }}>{ch}</span>
                }
            }
        )
    }
}

function defaultDelayBefore(node: React.ReactNode): number {
    if (_.isString(node) && node.length === 1) {
        return 40
    } else if (_.isObject(node) && 'type' in node && node.type === 'p') {
        return 500
    } else {
        return 0
    }
}

function defaultDelayAfter(node: React.ReactNode): number {
    if (node === ',') {
        return 200
    } else {
        return 0
    }
}

function mapCharactersToRevealTime(startNode: React.ReactNode): number[] {
    const msToReachChar: number[] = []
    let charIndex = 0
    let total = 0

    function crawl(node: React.ReactNode, opts: RevealOptions = {}): React.ReactNode {
        const delayBefore = opts.delayBefore || defaultDelayBefore
        const delayAfter = opts.delayAfter || defaultDelayAfter
        total += delayBefore(node)

        if (_.isString(node)) {
            if (node.length === 1) {
                msToReachChar[charIndex] = total
                charIndex += 1
            } else {
                Array.from(node).map(n => crawl(n, opts))
            }
        } else if (_.isArray(node)) {
            node.map(n => crawl(n, opts))
        } else if (_.isObject(node) && 'props' in node) {
            if (node.type === Reveal) {
                if (_.isNumber(node.props.delay)) {
                    total += node.props.delay
                }

                opts = Object.assign({}, node.props)
            }
            if ('children' in node.props)
                crawl(node.props.children, opts)
        }

        total += delayAfter(node)
    }

    crawl(startNode)

    return msToReachChar
}

/**
 * To do a cool type effect, we want to operate on html styling per-character.
 * The easiest way to do this is to wrap each character in a span element and
 * use the resulting array of spans.
 * However! We cannot just flatten the tree itself to an array of spans and use 
 * those, because we want to be able to do other formatting of the text as well.
 * So we use this function which maps over the sequence of characters in a JSX tree
 * while preserving the tree structure.
 */
function mapCharacters(el: React.ReactNode, callback: (ch: string, i: number) => React.ReactNode): React.ReactNode {
    let charIndex = 0
    let i = 0

    function crawl(node: React.ReactNode): React.ReactNode {
        if (_.isString(node)) {
            if (node.length === 1) {
                const result = callback(node, charIndex)
                charIndex += 1
                return result
            } else {
                return crawl(Array.from(node))
            }
        } else if (_.isArray(node)) {
            return node.map(n => crawl(n))
        } else if (_.isObject(node) && 'props' in node && 'children' in node.props) {
            const newEl = React.cloneElement(node, { key: `el-${i}`, children: crawl(node.props.children) })
            i += 1
            return newEl
        } else {
            return node
        }
    }

    return crawl(el)
}


type RevealOptions = {
    delay?: number
    delayBefore?: ((node: React.ReactNode) => number)
    delayAfter?: ((node: React.ReactNode) => number)
}


function Reveal(props: React.PropsWithChildren<RevealOptions>) {
    return <>{props.children}</>
}

const FloorIntroDiv = styled.div`
    height: 100%;
    font-size: 1.5em;
    padding: 1rem;
    text-align: center;
    word-break: break-word;

    img {
        width: 2rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
    }

    .outrage {
        font-size: 1.5em;
        margin-bottom: 1rem;
    }

    .titles {
        color: #c10fdf;
    }
`

export function FloorIntroOverlay() {
    const { ui } = useContext(FloorContext)

    const fullText = <div>
        <BobbleCreatureImage tile={CreatureTileDefOf.Mimic} />
        <p>
            <Reveal delay={1000} />
            <Reveal delayBefore={n => n === ' ' ? 500 : 0}>om nom nom</Reveal>
        </p>
        <p>
            <Reveal delayBefore={n => 15}>omnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnom</Reveal><Reveal delayBefore={n => 50}>nomnomnom</Reveal>
        </p>
        <p><Reveal delayBefore={n => 100}>omnomnomnom</Reveal></p>
        <p>
            <Reveal delayBefore={n => 100}>ommmm</Reveal>
            <Reveal delayBefore={n => 5}>nomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnomnom</Reveal>
        </p>
        <p>
            <Reveal delayBefore={n => n === ' ' ? 100 : 0}>nom</Reveal>
        </p>
    </div>


    const state = useLocalStore(() => new TextRevealer(ui, fullText))

    return useObserver(() => <Overlay>
        <FloorIntroDiv>
            {state.revealedText}
        </FloorIntroDiv>
    </Overlay>)
}
