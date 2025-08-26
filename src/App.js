
import React, { useState } from 'react';
import { Stage, Layer, Line, Text, Circle, Rect, RegularPolygon } from 'react-konva';

function App() {
  const [mode, setMode] = useState('design');
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [dimensionEdit, setDimensionEdit] = useState('');

  const handleClick = (e) => {
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
      const clickedLine = lines.find(line => {
        const distToLine = Math.abs(
          (line.p2.y - line.p1.y) * mousePos.x -
          (line.p2.x - line.p1.x) * mousePos.y +
          line.p2.x * line.p1.y - line.p2.y * line.p1.x
        ) / Math.sqrt(
          Math.pow(line.p2.y - line.p1.y, 2) +
          Math.pow(line.p2.x - line.p1.x, 2)
        );
        return distToLine < 5;
      });
      if (clickedLine) {
        setSelectedLine(clickedLine);
        setDimensionEdit(clickedLine.dimension_mm);
      } else {
        setSelectedLine(null);
      }
    }
  };

  const updateDimension = () => {
    if (selectedLine) {
      const updatedLines = lines.map(line =>
        line === selectedLine ? { ...line, dimension_mm: dimensionEdit } : line
      );
      setLines(updatedLines);
      setSelectedLine(null);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '250px', padding: '10px' }}>
        <h3>Modo de trabajo</h3>
        <button onClick={() => setMode('design')}>✏️ Modo Diseño</button>
        <button onClick={() => setMode('edit')}>🛠️ Modo Edición</button>

        {selectedLine && (
          <div style={{ marginTop: '20px' }}>
            <h4>Propiedades de la línea</h4>
            <label>Dimensión (mm):</label>
            <input
              type="number"
              value={dimensionEdit}
              onChange={(e) => setDimensionEdit(e.target.value)}
              style={{ width: '100px' }}
            />
            <button onClick={updateDimension}>Guardar</button>
          </div>
        )}
      </div>
      <Stage width={800} height={600} onClick={handleClick} style={{ border: '1px solid black' }}>
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
            </>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
