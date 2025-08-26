
import React, { useState } from 'react';
import { Stage, Layer, Line, Text, Circle } from 'react-konva';

function App() {
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
  const [obj1, setObj1] = useState('Conector');
  const [obj2, setObj2] = useState('BRK');
  const [showInput, setShowInput] = useState(false);
  const [inputPos, setInputPos] = useState({ x: 0, y: 0 });
  const [tempLine, setTempLine] = useState(null);
  const [dimension, setDimension] = useState('');

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
        dimension_mm: null
      };
      setTempLine(newLine);
      setInputPos(mousePos);
      setShowInput(true);
      setPoints([]);
    }
  };

  const confirmDimension = () => {
    if (tempLine) {
      tempLine.dimension_mm = dimension;
      setLines([...lines, tempLine]);
      setTempLine(null);
      setDimension('');
      setShowInput(false);
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
      <div style={{ position: 'relative' }}>
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
                  text={`${line.dimension_mm} mm`}
                  fontSize={14}
                  fill="blue"
                />
                <Circle x={line.p1.x} y={line.p1.y} radius={5} fill="red" />
                <Circle x={line.p2.x} y={line.p2.y} radius={5} fill="green" />
              </>
            ))}
          </Layer>
        </Stage>
        {showInput && (
          <div style={{
            position: 'absolute',
            left: inputPos.x,
            top: inputPos.y,
            background: 'white',
            border: '1px solid gray',
            padding: '5px'
          }}>
            <label>Dimensión (mm): </label>
            <input
              type="number"
              value={dimension}
              onChange={(e) => setDimension(e.target.value)}
              style={{ width: '80px' }}
            />
            <button onClick={confirmDimension}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
