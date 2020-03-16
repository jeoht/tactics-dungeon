export interface Item {
    id: string
    name: string
    itemType: 'weapon'|'consumable'
}

export type ItemType = Item['itemType']