import GridBoard from "@/components/GridBoard";

const App = () => {
  return (
    <div style={{ padding: 16 }}>
      <GridBoard
        rows={10}
        cols={12}
        cell={48}
        initial={{ row: 1, col: 1 }}
        stones={[[0, 0], [0, 1], { row: 3, col: 4 }]}
        boxes={[[2, 2], [2, 3], { row: 5, col: 7 }]}
      />
    </div>
  );
}

export default App
