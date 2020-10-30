import _ = require("lodash")
import type { TileDef } from './TileDef'

export const PlantTileDefOf = (() => {
    const tilesetCols = 55
    const sectionCols = 12
    const startIndex = 43
    const tilesetId = 'world'

    const tilesByName: Record<string, TileDef> = {}
    for (const key in PlantTileSequence) {
        const num = (PlantTileSequence[key] as any) as number | string
        if (!_.isNumber(num)) continue

        const subcol = num % sectionCols
        const row = Math.floor(num / sectionCols)
        const index = (tilesetCols * row) + startIndex + subcol
        tilesByName[key] = { tilesetId: tilesetId, index: index }
    }
    return tilesByName as Record<keyof typeof PlantTileSequence, TileDef>
})()

export type PlantTileDefId = keyof typeof PlantTileSequence

// Starts 43 to 54
enum PlantTileSequence {
    Bush = 0,
    Bush2,
    LittleBushes,
    LittleBushes2,
    LittleBush,
    BushBrown,
    BushBrown2,
    LittleBushesBrown,
    LittleBushesBrown2,
    LittleBushBrown,
    Lilypads,
    Lilypad,
    FlowersThree,
    FlowersTwo,
    Flower,
    PadsFour,
    BoulderBrown,
    BoulderGrey,
    CloverStar,
    CloverStarSmall,
    PuddleBlue,
    PuddleBlueSmall,
    PuddleRed,
    PuddleRedSmall,
    CaveEntrance,
    PointyBoulderBrown,
    PointyBoulderGrey,
    PointyBoulderGrey2,
    SittingStones,
    Cactus,
    Cactus2,
    Cactus3,
    PuddleGreen,
    PuddleGreenSmall,
    PuddleBrown,
    PuddleBrownSmal,
    TreeApple,
    TreeAppleFruiting,
    TreeAppleAutumn,
    TreeAppleDead,
    TreeAppleStump,
    TreePine,
    TreePineFrosted,
    // continues
}