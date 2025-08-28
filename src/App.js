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
  const [mousePos, setMousePos] = useState(null);
  const [hoveredObj, setHoveredObj] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null); // { lineIndex, end: 'p1' | 'p2' }
  const [nameInput, setNameInput] = useState('');

  const handleStageClick = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (mode === 'design') {
      if (points.length === 0) {
        setPoints([pos]);
      } else {
        const newLine = {
          p1: points[0],
          p2: pos,
          obj1,
          obj2,
          nombre_obj1: '',
          nombre_obj2: '',
          dimension_mm: null,
          item: null
        };
        setTempLine(newLine);
        setInputPos(pos);
        setShowInput(true);
        setPoints([]);
        setMousePos(null); // limpiar mousePos al terminar
      }
    }
  };

  const handleMouseMove = (e) => {
    if (mode === 'design' && points.length === 1) {
      const stage = e.target.getStage();
      const pos = stage.getPointerPosition();
      setMousePos(pos);
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

  const updateNombre = () => {
    if (selectedEnd) {
      const updatedLines = [...lines];
      if (selectedEnd.end === 'p1') {
        updatedLines[selectedEnd.lineIndex].nombre_obj1 = nameInput;
      } else {
        updatedLines[selectedEnd.lineIndex].nombre_obj2 = nameInput;
      }
      setLines(updatedLines);
      setSelectedEnd(null);
      setNameInput('');
    }
  };

  const renderObjeto = (tipo, x, y, key, index, end) => {
    const isHovered = hoveredObj === key;
    const commonProps = {
      key,
      x,
      y,
      fill: isHovered ? 'yellow' : tipo === 'Conector' ? 'orange' : tipo === 'BRK' ? 'red' : 'green',
      onMouseEnter: () => setHoveredObj(key),
      onMouseLeave: () => setHoveredObj(null),
      onClick: () => {
        setSelectedEnd({ lineIndex: index, end });
        setNameInput(end === 'p1' ? lines[index].nombre_obj1 : lines[index].nombre_obj2);
      },
    };

    switch (tipo) {
      case 'Conector':
        return <Rect {...commonProps} x={x - 5} y={y - 5} width={10} height={10} />;
      case 'BRK':
        return <Circle {...commonProps} radius={6} />;
      case 'SPL':
        return <RegularPolygon {...commonProps} sides={3} radius={7} />;
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

        {selectedEnd && (
          <>
            <h4>Editar nombre del objeto</h4>
            <label>Nombre:</label>
            <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            <button onClick={updateNombre}>Asignar</button>
          </>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <Stage
          width={800}
          height={600}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
          style={{ border: '1px solid black' }}
        >
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
                {line.nombre_obj1 && (
                  <Text x={line.p1.x + 5} y={line.p1.y - 15} text={line.nombre_obj1} fontSize={10} fill="black" />
                )}
                {line.nombre_obj2 && (
                  <Text x={line.p2.x + 5} y={line.p2.y - 15} text={line.nombre_obj2} fontSize={10} fill="black" />
                )}
                {renderObjeto(line.obj1, line.p1.x, line.p1.y, `obj1-${i}`, i, 'p1')}
                {renderObjeto(line.obj2, line.p2.x, line.p2.y, `obj2-${i}`, i, 'p2')}
              </React.Fragment>
            ))}

            {points.length === 1 && mousePos && (
              <Line
                points={[points[0].x, points[0].y, mousePos.x, mousePos.y]}
                stroke="gray"
                dash={[4, 4]}
                strokeWidth={1}
              />
            )}
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

