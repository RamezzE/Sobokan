# Sobokan Task 1

## Video Preview
https://github.com/user-attachments/assets/16f0f4b7-7d80-4037-8679-6cae09d8ebb3

## Methodology 
Since this is a simple 2D game, all data is handled by changes in 2D coordinates that reflect within the UI. The GridBoard component has props to determine which tiles contain sand (normal tile), stone (obstacle) or box (tile that can be moved). 

```ts
type GridBoardProps = {
    rows?: number;
    cols?: number;
    cell?: number; // px per cell
    initial?: { row: number; col: number };
    stones?: Coord[]; // cells with stone.png
    boxes?: Coord[];   // initial layout only
    restart?: boolean; // when toggled, resets player and boxes to initial
    onRestarted?: () => void; // called after restart is processed
    finishPoints?: Coord[];  // must have same count as initial boxes
};
```

## How AI helped
I used ChatGPT 5 to assist in developing. It helped a lot with the logic of accurately moving the PlayerSprite component from one tile to another, taking the tile size into consideration, as well as the logic of detecting when the player can move a box or not. These were all simple 2D coordinate comparisons.  
