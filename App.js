
import React, { useState } from 'react';
import { Stage, Layer, Line, Text, Rect, Circle, RegularPolygon } from 'react-konva';

function App() {
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
  const [obj1, setObj1] = useState('Ninguno');
  const [obj2, setObj2] = useState('Ninguno');

  const findClosestExtremo = (point) => {
    let minDist = 30;
    let closest = point;
    lines.forEach(line => {
      [line.p1, line.p2].forEach(ext => {
        const dist = Math.hypot(point.x - ext.x, point.y - ext.y);
        if (dist < minDist) {
          minDist = dist;
          closest = ext;
        }
      });
    });
    return closest;
  };

  const handleClick = (e) => {
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();
    const snappedPoint = findClosestExtremo(mousePos);

    if (points.length === 0) {
      setPoints([snappedPoint]);
    } else {
      const newLine = {
        p1: points[0],
        p2: snappedPoint,
        obj1,
        obj2,
        length: Math.round(
          Math.sqrt(
            Math.pow(snappedPoint.x - points[0].x, 2) +
            Math.pow(snappedPoint.y - points[0].y, 2)
          )
        )
      };
      setLines([...lines, newLine]);
      setPoints([]);
    }
  };

  const renderObjeto = (obj, x, y) => {
    switch (obj) {
      case 'Conector':
        return <Rect x={x - 5} y={y - 5} width={10} height={10} fill="blue" />;
      case 'BRK':
        return <Circle x={x} y={y} radius={5} fill="black" />;
      case 'SPL':
        return <RegularPolygon x={x} y={y} sides={3} radius={6} fill="red" rotation={180} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <div style={{ width: '200px', padding: '10px' }}>
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
      </div>
      <Stage width={800} height={600} onClick={handleClick} style={{ border: '1px solid black' }}>
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
                text={`${line.length} px`}
                fontSize={14}
                fill="blue"
              />
              {renderObjeto(line.obj1, line.p1.x, line.p1.y)}
              {renderObjeto(line.obj2, line.p2.x, line.p2.y)}
            </React.Fragment>
          ))}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
