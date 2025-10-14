import { useEffect, useMemo, useRef, useState } from "react";

import frame_1 from "@/assets/player/frame-1.png";
import frame_2 from "@/assets/player/frame-2.png";
import frame_3 from "@/assets/player/frame-3.png";
import frame_4 from "@/assets/player/frame-4.png";

type PlayerSpriteProps = {
    fps?: number;     // frames per second (e.g., 12, 24, 30)
    size?: number;  // size in pixels (width and height)
    playing?: boolean;
    className?: string;
    alt?: string;
};

const PlayerSprite = ({
    fps = 12,
    size = 60,
    playing = true,
    className,
    alt = "Player Sprite",
}: PlayerSpriteProps) => {
    const frames = useMemo(() => [frame_1, frame_2, frame_3, frame_4], []);
    const [i, setI] = useState(0);
    const timerRef = useRef<number | null>(null);

    // Preload frames once
    useEffect(() => {
        frames.forEach(src => {
            const img = new Image();
            img.src = src as unknown as string;
        });
    }, [frames]);

    // Pause when tab is hidden (saves CPU)
    const visibleRef = useRef(true);
    useEffect(() => {
        const onVis = () => {
            visibleRef.current = !document.hidden;
            // if you switch back to the tab, restart the interval
            if (visibleRef.current && playing) start();
            else stop();
        };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, [playing]);

    // Start/stop interval based on fps/playing
    useEffect(() => {
        if (playing) start();
        return stop;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playing, fps]);

    const start = () => {
        stop();
        const interval = Math.max(1, Math.floor(1000 / fps)); // ms per frame
        timerRef.current = window.setInterval(() => {
            if (!visibleRef.current) return;
            setI(prev => (prev + 1) % frames.length);
        }, interval);
    }

    const stop = () => {
        if (timerRef.current !== null) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }

    return (
        <img
            src={frames[i] as unknown as string}
            alt={alt}
            width={size}
            height={size}
            className={className}
            draggable={false}
        />
    );
};

export default PlayerSprite;
