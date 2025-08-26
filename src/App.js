
import React, { useState } from 'react';
import { Stage, Layer, Line, Text, Circle } from 'react-konva';

function App() {
  const [mode, setMode] = useState('design');
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
  const [selectedLineIndex, setSelectedLineIndex] = useState(null);
  const [dimensionEdit, setDimensionEdit] = useState('');

  const handleStageClick = (e) => {
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();

    if (mode === 'design') {
      if (points.length === 0) {
        setPoints([mousePos]);
      } else {
        const newLine = {
          p1: points[0],
          p2: mousePos,
          dimension_mm: Math.round(
            Math.sqrt(
              Math.pow(mousePos.x - points[0].x, 2) +
              Math.pow(mousePos.y - points[0].y, 2)
            )
          )
        };
        setLines([...lines, newLine]);
        setPoints([]);
      }
    } else if (mode === 'edit') {
      const clickedIndex = lines.findIndex(line => {
        const { p1, p2 } = line;
        const distToLine = Math.abs(
          (p2.y - p1.y) * mousePos.x -
          (p2.x - p1.x) * mousePos.y +
          p2.x * p1.y - p2.y * p1.x
        ) / Math.sqrt(
          Math.pow(p2.y - p1.y, 2) +
          Math.pow(p2.x - p1.x, 2)
        );
        return distToLine < 5;
      });
      if (clickedIndex !== -1) {
        setSelectedLineIndex(clickedIndex);
        setDimensionEdit(lines[clickedIndex].dimension_mm);
      } else {
        setSelectedLineIndex(null);
      }
    }
  };

  const updateDimension = () => {
    if (selectedLineIndex !== null) {
      const updatedLines = [...lines];
      updatedLines[selectedLineIndex].dimension_mm = dimensionEdit;
      setLines(updatedLines);
      setSelectedLineIndex(null);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '250px', padding: '10px', borderRight: '1px solid gray' }}>
        <h3>Modo de trabajo</h3>
        <button onClick={() => setMode('design')} style={{ marginRight: '10px' }}>✏️ Diseño</button>
        <button onClick={() => setMode('edit')}>🛠️ Edición</button>

        {selectedLineIndex !== null && (
          <div style={{ marginTop: '20px' }}>
            <h4>Editar línea</h4>
            <label>Dimensión (mm):</label>
            <input
              type="number"
              value={dimensionEdit}
              onChange={(e) => setDimensionEdit(e.target.value)}
              style={{ width: '100px', marginLeft: '5px' }}
            />
            <br />
            <button onClick={updateDimension} style={{ marginTop: '10px' }}>Guardar</button>
          </div>
        )}
      </div>
      <Stage width={800} height={600} onClick={handleStageClick} style={{ border: '1px solid black' }}>
        <Layer>
          {lines.map((line, i) => (
            <>
              <Line
                key={`line-${i}`}
                points={[line.p1.x, line.p1.y, line.p2.x, line.p2.y]}
                stroke="black"
                strokeWidth={2}
              />
              <Text
                x={(line.p1.x + line.p2.x) / 2}
                y={(line.p1.y + line.p2.y) / 2 - 10}
                text={`${line.dimension_mm} mm`}
                fontSize={10}
                fill="blue"
              />
              <Circle x={line.p1.x} y={line.p1.y} radius={3} fill="red" />
              <Circle x={line.p2.x} y={line.p2.y} radius={3} fill="green" />
            </>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
