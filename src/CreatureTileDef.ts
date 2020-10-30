import _ = require("lodash")
import type { TileDef } from './TileDef'

/**
 * Note that every second row of the creature tileset contains
 * second frames for the creatures directly above.
 */
enum CreatureTileSequence {
    // ROW 1
    SunPaladin = 0, Ranger, Sniper, Esper, Priest, Druid, Warrior, Fencer, Cleric, SunPaladin2, Ranger2, Sniper2, Esper2, Priest2, Druid2, Warrior2, Fencer2, Cleric2,
    // ROW 3
    Rogue, Rookie, Guy, Girl, Merchant, Chef, Chef2, Minister, King, Queen, Prince, Princess, Pikeman, Pikewoman, PikeHelmet, Pikeman2, Pikewoman2, PikeHelmet2,
    // ROW 5
    Rogue2, Rookie2, Guy2, Girl2, Merchant2, Shirtless, FunnyHat, Minister2, King2, Queen2, Prince2, Princess2, Pikeman3, Pikewoman3, PikeHelmet3, Pikeman4, Pikewoman4, PikeHelmet4,
    // ROW 7 
    SinisterGirl, SinisterGuy, Dwarf, Dwarf2, DwarfCleric, DrowSaberHood, DrowSaber, DrowArcher, DrowMage, DrowPriestess, GelfSword, GelfSwordShield, GelfArcher, GelfPole, GelfSword2, GelfSwordShield2, GelfArcher2, GelfPole2,
    // ROW 9 
    SnelfSword, SnelfSwordShield, SnelfArcher, SnelfPole, SnelfSword2, SnelfSwordShield2, SnelfArcher2, SnelfPole2, LizardPole, LizardArcher, LizardPoleShield, LizardPoleSkirt, LizardLeader, Halfling, HalflingHood, Halfling2, HalfingHat, HalflingOld,
    // ROW 11 
    Werewolf, WerewolfYellow, WerewolfRed, WerewolfCloth, Brute, BruteGrey, BruteRed, DemonBlue, DemonRed, DemonBrown, Golem, Golem2, Golem3, GolemMagma, GolemBone, Djinn, EvilTree, Mimic,
    // ROW 13 
    JellyPurple, JellyGreen, Bat, BatRed, Beholder, Spider, Spider2, Rat, Rat2, Cobra, Fly, Fly2, Wolf, WolfBrown, WolfBlack, Bird, BirdBlue, BirdBlack,
    // ROW 15 
    GoblinSword, GoblinArcher, GoblinSwordHelmet, GoblinHat, GoblinStaff, DarkGoblinSword, DarkGoblinHelmet, DarkGoblinStaff, OgreGreen, OgreRed, OgreCream, OgreBrown, KnightRed, KnightBlue, KnightYellow, BeastyBrown, BeastyBlue, BeastyGrey,
    // ROW 17 
    Zombie, ZombieHeadless, Skeleton, SkeletonArcher, SkeletonEquipped, GhostDark, Ghost, Mummy, MummyPriest, Lich, LichFaceless, LichMaster, VampireRed, VampireBlue, VampireLord, Witch, WitchBlue, WitchGreen,
    // ROW 19 
    DragonRed, DragonPurple, DragonOrange, DragonGreen, Yeti, YetiOrange, Worm, WormOrange, BearOrange, BearBlack, BearWhite, ScorpionRed, ScorpionCream, ScorpionBlack, TwoHeadedOgre, TwoHeadedOgre2, Fairy, Imp,
    // ROW 21 
    OrbThingBlue, OrbThingMagenta, Bulb, BulbAngry, BlobRed, BlobBlue, BlobGrey, BlobBrown, Eye, Eyes, ElementalRed, ElementalBlue, ElementalYellow, CubeBlue, CubeGreen, CubeRed, FireRed, FireBlue
}

export const CreatureTileDefOf = (() => {
    const tilesByName: Record<string, TileDef> = {}

    let offset = 0
    for (const key in CreatureTileSequence) {
        const num = (CreatureTileSequence[key] as any) as number | string
        if (!_.isNumber(num)) continue

        if (num > 0 && num % 18 === 0)
            offset += 18

        tilesByName[key] = { tilesetId: 'creatures', index: offset + num }
    }

    return tilesByName as Record<keyof typeof CreatureTileSequence, TileDef>
})()