## Prompt 1:

I want to cycle through these frames every few ms so that it would seem like the player is animating.

```ts
import frame_1 from '@/assets/player/frame-1.png';
import frame_2 from '@/assets/player/frame-2.png';
import frame_3 from '@/assets/player/frame-3.png';
import frame_4 from '@/assets/player/frame-4.png';

const PlayerSprite = () => {
    return (
        <div>
            <img src={frame_1} alt="Player Sprite" />
        </div>
    )
}

export default PlayerSprite
```

## Prompt 2:

I want to create a grid that I could move my PlayerSprite with. I want to be able to move my Sprite using the WASD or arrow controls in the Up, Right, Left, Down directions. I also want to specify the size of the grid, and only allow the PlayerSprite to move within the grid.

## Prompt 3: 

Can you only use Tailwind in GridBoard?

## Prompt 4:

I want to pass an array of coordinates to the gridboard. This array would let the grids in these coordinates contain a texture named stone.png

Update this component:

```ts
import { useEffect, useRef, useState } from "react";
import PlayerSprite from "./PlayerSprite";

type GridBoardProps = {
    rows?: number;
    cols?: number;
    cell?: number; // px per cell
    initial?: { row: number; col: number };
    showCoords?: boolean;
};

const GridBoard = ({
    rows = 10,
    cols = 10,
    cell = 48,
    initial = { row: 0, col: 0 },
    showCoords = true,
}: GridBoardProps) => {
    const [pos, setPos] = useState(initial);
    const boardRef = useRef<HTMLDivElement>(null);

    const clamp = (v: number, min: number, max: number) =>
        Math.max(min, Math.min(max, v));

    const moveBy = (dr: number, dc: number) =>
        setPos(p => ({
            row: clamp(p.row + dr, 0, rows - 1),
            col: clamp(p.col + dc, 0, cols - 1),
        }));

    useEffect(() => {
        boardRef.current?.focus();
    }, []);

    const onKeyDown = (e: React.KeyboardEvent) => {
        let handled = true;
        switch (e.key) {
            case "ArrowUp":
            case "w":
            case "W":
                moveBy(-1, 0);
                break;
            case "ArrowDown":
            case "s":
            case "S":
                moveBy(1, 0);
                break;
            case "ArrowLeft":
            case "a":
            case "A":
                moveBy(0, -1);
                break;
            case "ArrowRight":
            case "d":
            case "D":
                moveBy(0, 1);
                break;
            default:
                handled = false;
        }
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    // We expose dynamic values to Tailwind via CSS variables.
    // Tailwind arbitrary values then read these (e.g., w-[var(--w)]).
    const vars = {
        // board size
        ["--cell" as any]: `${cell}px`,
        ["--w" as any]: `${cols * cell}px`,
        ["--h" as any]: `${rows * cell}px`,
        // sprite position (in cells)
        ["--r" as any]: `${pos.row}`,
        ["--c" as any]: `${pos.col}`,
    };

    return (
        <div className="space-y-2">
            <div
                ref={boardRef}
                tabIndex={0}
                onKeyDown={onKeyDown}
                onClick={() => boardRef.current?.focus()}
                // Tailwind-only styling; background grid via arbitrary bg-image + bg-size.
                className={[
                    "relative outline-none rounded-lg border border-black/20",
                    "bg-[image:linear-gradient(to_right,rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.1)_1px,transparent_1px)]",
                    "bg-[length:var(--cell)_var(--cell)]",
                    "select-none",
                ].join(" ")}
                style={vars}
            >
                {/* Board size via Tailwind reading CSS vars */}
                <div className="w-[var(--w)] h-[var(--h)]" />

                {/* Sprite wrapper absolutely positioned using translate from CSS vars */}
                <div
                    className={[
                        "absolute top-0 left-0",
                        "w-[var(--cell)] h-[var(--cell)]",
                        "translate-x-[calc(var(--c)*var(--cell))] translate-y-[calc(var(--r)*var(--cell))]",
                        "grid place-items-center",
                        "pointer-events-none",
                        "image-render-pixelated", // Tailwind 3.4+ supports this alias; fallback below if needed
                    ].join(" ")}
                >
                    {/* Ensure the sprite image fills the cell */}
                    <PlayerSprite fps={12} className="w-3/4 h-3/4" />
                </div>
            </div>

            {showCoords && (
                <p className="font-mono text-sm">
                    row: {pos.row} &nbsp; col: {pos.col}
                </p>
            )}
        </div>
    );
}

export default GridBoard;
```

## Prompt 5:

I want to also pass an array of coordinates where there would be a box.svg

## Prompt 6:

The rest of the tiles should be sand.svg

Tell me exactly what to add.

## Prompt 7:

In addition, I want to be able to push the boxes using my player. The boxes coordinates should only be the initial layout. 

A box can only be pushed up, right, left, down. It cannot be pushed if there is a stone after it, and it cannot be pushed if there is another box after it.

Let me know what are the changes that need to be applied to my GridBoard component.

## Prompt 8:

```tsx
<div className="absolute inset-0 flex justify-center items-center">
```
Center this using absolute positioning 

Center it vertically and horizontally

## Prompt 9:

I want to pass another array of finishPoints. These would render a simple red dot above the sand. 

The finish points must be the same number as the boxes. 

Whenever the player moves, I want to check if the finishPoints are all covered by boxes. If they are, then the player wins.
