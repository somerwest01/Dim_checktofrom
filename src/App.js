
import React, { useState } from 'react';
import { Stage, Layer, Line, Text, Circle, Rect, RegularPolygon } from 'react-konva';

function App() {
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
  const [obj1, setObj1] = useState('Ninguno');
  const [obj2, setObj2] = useState('Ninguno');
  const [showInput, setShowInput] = useState(false);
  const [inputPos, setInputPos] = useState({ x: 0, y: 0 });
  const [tempLine, setTempLine] = useState(null);
  const [dimension, setDimension] = useState('');
  const [name1, setName1] = useState('');
  const [name2, setName2] = useState('');

  const distancia = (p1, p2) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  const encontrarExtremoCercano = (punto, umbral = 30) => {
    const extremos = lines.flatMap(line => [line.p1, line.p2]);
    for (let ext of extremos) {
      if (distancia(punto, ext) < umbral) {
        return ext;
      }
    }
    return punto;
  };

  const handleClick = (e) => {
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();
    const conectado = encontrarExtremoCercano(mousePos);

    if (points.length === 0) {
      setPoints([conectado]);
    } else {
      const newLine = {
        p1: points[0],
        p2: conectado,
        obj1,
        obj2,
        dimension_mm: null,
        nombre1: '',
        nombre2: ''
      };
      setTempLine(newLine);
      setInputPos(conectado);
      setShowInput(true);
      setPoints([]);
    }
  };

  const confirmInputs = () => {
    if (tempLine) {
      tempLine.dimension_mm = dimension;
      tempLine.nombre1 = (tempLine.obj1 !== 'BRK' and tempLine.obj1 !== 'Ninguno') ? name1 : '';
      tempLine.nombre2 = (tempLine.obj2 !== 'BRK' and tempLine.obj2 !== 'Ninguno') ? name2 : '';
      setLines([...lines, tempLine]);
      setTempLine(null);
      setDimension('');
      setName1('');
      setName2('');
      setShowInput(false);
    }
  };

  const retrocederLinea = () => {
    setLines(lines.slice(0, -1));
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

  const calcularAngulo = (p1, p2) => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return (Math.atan2(dy, dx) * 180) / Math.PI;
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '220px', padding: '10px' }}>
        <h3>Herramientas</h3>
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
        <br /><br />
        <button onClick={retrocederLinea}>⏪ Retroceder última línea</button>
      </div>
      <div style={{ position: 'relative' }}>
        <Stage width={800} height={600} onClick={handleClick} style={{ border: '1px solid black' }}>
          <Layer>
            {lines.map((line, i) => {
              const xm = (line.p1.x + line.p2.x) / 2;
              const ym = (line.p1.y + line.p2.y) / 2;
              const angle = calcularAngulo(line.p1, line.p2);
              return (
                <>
                  <Line
                    key={`line-${i}`}
                    points={[line.p1.x, line.p1.y, line.p2.x, line.p2.y]}
                    stroke="black"
                    strokeWidth={2}
                  />
                  <Text
                    x={xm}
                    y={ym}
                    text={`${line.dimension_mm} mm`}
                    fontSize={10}
                    fill="blue"
                    rotation={angle}
                    offsetX={20}
                    offsetY={5}
                  />
                  {renderObjeto(line.obj1, line.p1.x, line.p1.y, `obj1-${i}`)}
                  {renderObjeto(line.obj2, line.p2.x, line.p2.y, `obj2-${i}`)}
                  {line.nombre1 && (
                    <Text
                      x={line.p1.x}
                      y={line.p1.y - 15}
                      text={line.nombre1}
                      fontSize={10}
                      fill="magenta"
                    />
                  )}
                  {line.nombre2 && (
                    <Text
                      x={line.p2.x}
                      y={line.p2.y - 15}
                      text={line.nombre2}
                      fontSize={10}
                      fill="magenta"
                    />
                  )}
                </>
              );
            })}
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
            {(obj1 !== 'BRK' && obj1 !== 'Ninguno') && (
              <>
                <br />
                <label>Nombre objeto 1:</label>
                <input
                  type="text"
                  value={name1}
                  onChange={(e) => setName1(e.target.value)}
                  style={{ width: '120px' }}
                />
              </>
            )}
            {(obj2 !== 'BRK' && obj2 !== 'Ninguno') && (
              <>
                <br />
                <label>Nombre objeto 2:</label>
                <input
                  type="text"
                  value={name2}
                  onChange={(e) => setName2(e.target.value)}
                  style={{ width: '120px' }}
                />
              </>
            )}
            <br />
            <button onClick={confirmInputs}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
