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

const FloorIntroDiv = styled.div`
    height: 100%;
    font-size: 1.5em;
    padding: 1rem;
`

// First Minister of the Lich Republic
// The people of this great nation did not conquer death merely to face obliteration at the whim of some unelected council of gods.
// My constituents demand action and the government has a mandate to answer!

class TextRevealer {
    startTime: number

    constructor(readonly ui: UI, readonly fullText: React.ReactNode) {
        this.startTime = ui.time.now
    }

    @computed get msToReachChar(): number[] {
        const msToReachChar: number[] = []
        let total = 0
        mapCharacters(
            this.fullText,
            (ch, i, parent) => {
                // Reveal speed can vary depending on context
                if (parent && parent.type === 'strong')
                    total += 200
                else
                    total += 25

                msToReachChar.push(total)
                return ch
            }
        )
        return msToReachChar
    }

    @computed get revealedText(): React.ReactNode {
        const timePassed = this.ui.time.now - this.startTime
        return mapCharacters(
            this.fullText,
            (ch, i) => {
                if (timePassed >= this.msToReachChar[i]) {
                    return <span>{ch}</span>
                } else {
                    return <span style={{ opacity: 0 }}>{ch}</span>
                }
            }
        )
    }
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
function mapCharacters(el: React.ReactNode, callback: (ch: string, i: number, parent?: React.ReactElement) => React.ReactNode): React.ReactNode {
    let charIndex = 0

    function crawl(node: React.ReactNode, parent?: React.ReactElement): React.ReactNode {
        if (_.isString(node)) {
            if (node.length === 1) {
                const result = callback(node, charIndex, parent)
                charIndex += 1
                return result
            } else {
                return crawl(Array.from(node), parent)
            }
        } else if (_.isArray(node)) {
            return node.map(n => crawl(n, parent))
        } else if (_.isObject(node) && 'props' in node && 'children' in node.props && node.props.children.length) {
            const newEl = React.cloneElement(node, { children: crawl(node.props.children, node) })
            return newEl
        } else {
            return node
        }
    }

    return crawl(el)
}

export function FloorIntroOverlay() {
    const { ui } = useContext(FloorContext)

    const fullText = <div>We do not recognize the authority of an <strong>unelected</strong> council to terminate the multiverse.</div>,
    const state = useLocalStore(() => new TextRevealer(ui, fullText))

    return useObserver(() => <Overlay>
        <FloorIntroDiv>
            {state.revealedText}
        </FloorIntroDiv>
    </Overlay>)
}
