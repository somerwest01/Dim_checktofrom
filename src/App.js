
import React, { useState } from 'react';
import { Stage, Layer, Line, Text, Circle } from 'react-konva';

function App() {
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
  const [obj1, setObj1] = useState('Conector');
  const [obj2, setObj2] = useState('BRK');

  const handleClick = (e) => {
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();
    if (points.length === 0) {
      setPoints([mousePos]);
    } else {
      const newLine = {
        p1: points[0],
        p2: mousePos,
        obj1,
        obj2,
        length: Math.round(
          Math.sqrt(
            Math.pow(mousePos.x - points[0].x, 2) +
            Math.pow(mousePos.y - points[0].y, 2)
          )
        )
      };
      setLines([...lines, newLine]);
      setPoints([]);
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '200px', padding: '10px' }}>
        <h3>Herramientas</h3>
        <label>Objeto extremo 1:</label>
        <select value={obj1} onChange={(e) => setObj1(e.target.value)}>
          <option>Conector</option>
          <option>BRK</option>
          <option>SPL</option>
        </select>
        <br /><br />
        <label>Objeto extremo 2:</label>
        <select value={obj2} onChange={(e) => setObj2(e.target.value)}>
          <option>Conector</option>
          <option>BRK</option>
          <option>SPL</option>
        </select>
      </div>
      <Stage width={800} height={600} onClick={handleClick} style={{ border: '1px solid black' }}>
        <Layer>
          {lines.map((line, i) => (
            <>
              <Line
                key={i}
                points={[line.p1.x, line.p1.y, line.p2.x, line.p2.y]}
                stroke="black"
                strokeWidth={2}
              />
              <Text
                x={(line.p1.x + line.p2.x) / 2}
                y={(line.p1.y + line.p2.y) / 2 - 10}
                text={`${line.length} px`}
                fontSize={14}
                fill="blue"
              />
              <Circle x={line.p1.x} y={line.p1.y} radius={5} fill="red" />
              <Circle x={line.p2.x} y={line.p2.y} radius={5} fill="green" />
            </>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
