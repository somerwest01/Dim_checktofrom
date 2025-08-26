
import React, { useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Circle, RegularPolygon } from 'react-konva';

function App() {
  const [mode, setMode] = useState('design');
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
  const [obj1, setObj1] = useState('Ninguno');
  const [obj2, setObj2] = useState('Ninguno');
  const [dimension, setDimension] = useState('');
  const [inputPos, setInputPos] = useState({ x: 0, y: 0 });
  const [showInput, setShowInput] = useState(false);
  const [tempLine, setTempLine] = useState(null);

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
          obj1,
          obj2,
          dimension_mm: null
        };
        setTempLine(newLine);
        setInputPos(mousePos);
        setShowInput(true);
        setPoints([]);
      }
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

  const renderObjeto = (tipo, x, y, key) => {
    switch (tipo) {
      case 'Conector':
        return <Rect key={key} x={x - 5} y={y - 5} width={10} height={10} fill="orange" />;
      case 'BRK':
        return <Circle key={key} x={x} y={y} radius={6} fill="red" />;
      case 'SPL':
        return <RegularPolygon key={key} x={x} y={y} sides={3} radius={7} fill="green" />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '250px', padding: '10px', borderRight: '1px solid gray' }}>
        <h3>Modo de trabajo</h3>
        <button onClick={() => setMode('design')} style={{ marginRight: '10px' }}>✏️ Diseño</button>
        <button onClick={() => setMode('edit')}>🛠️ Edición</button>

        {mode === 'design' && (
          <>
            <h4>Herramientas</h4>
            <label>Objeto extremo 1:</label>
            <select value={obj1} onChange={(e) => setObj1(e.target.value)}>
              <option>Ninguno</option>
              <option>Conector</option>
              <option>BRK</option>
              <option>SPL</option>
            </select>
            <br /><br />
            <label>Objeto extremo 2:</label>
            <select value={obj2} onChange={(e) => setObj2(e.target.value)}>
              <option>Ninguno</option>
              <option>Conector</option>
              <option>BRK</option>
              <option>SPL</option>
            </select>
          </>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        <Stage width={800} height={600} onClick={handleStageClick} style={{ border: '1px solid black' }}>
          <Layer>
            {lines.map((line, i) => (
              <React.Fragment key={i}>
                <Line
                  points={[line.p1.x, line.p1.y, line.p2.x, line.p2.y]}
                  stroke="black"
                  strokeWidth={2}
                />
                <Text
                  x={(line.p1.x + line.p2.x) / 2}
                  y={(line.p1.y + line.p2.y) / 2 - 10}
                  text={`${line.dimension_mm || ''} mm`}
                  fontSize={10}
                  fill="blue"
                />
                {renderObjeto(line.obj1, line.p1.x, line.p1.y, `obj1-${i}`)}
                {renderObjeto(line.obj2, line.p2.x, line.p2.y, `obj2-${i}`)}
              </React.Fragment>
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
