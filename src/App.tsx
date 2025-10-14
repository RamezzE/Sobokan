import GridBoard from "@/components/GridBoard";
import { stoneCoordinates, boxCoordinates } from "@/constants/coordinates";

const App = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-y-4 w-screen h-screen">
      <h1 className="font-semibold">Sokoban Game - Using React, TypeScript & TailwindCSS</h1>
      <GridBoard
        rows={10}
        cols={12}
        cell={48}
        initial={{ row: 1, col: 1 }}
        stones={stoneCoordinates}
        boxes={boxCoordinates}
      />

      <button className="bg-blue-700 p-2 rounded-lg text-white">
        Restart
      </button>
    </div>
  );
}

export default App
