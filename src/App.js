import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './App.css';

import { Stage, Layer, Line, Text, Rect, Circle, RegularPolygon, Label, Tag, Group } from 'react-konva';

function App() {
  const [mode, setMode] = useState('design');
  const [lines, setLines] = useState([]);
  const [points, setPoints] = useState([]);
//  const [obj1, setObj1] = useState('Ninguno');
//  const [obj2, setObj2] = useState('Ninguno');
  const [dimension, setDimension] = useState('');
  const [inputPos, setInputPos] = useState({ x: 0, y: 0 });
  const [showInput, setShowInput] = useState(false);
  const [tempLine, setTempLine] = useState(null);
  const [mousePos, setMousePos] = useState(null);
  const [hoveredObj, setHoveredObj] = useState(null);
  const [selectedEnd, setSelectedEnd] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [eraserMode, setEraserMode] = useState(false);
  const [nameInput1, setNameInput1] = useState('');
  const [nameInput2, setNameInput2] = useState('');
  const [distanciaRuta, setDistanciaRuta] = useState(null);
  const [rutaCalculada, setRutaCalculada] = useState([]);
  const [pencilMode, setPencilMode] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [archivoProcesado, setArchivoProcesado] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false);
 // const [mostrarExtremos, setMostrarExtremos] = useState(false);
  const [mostrarExcel, setMostrarExcel] = useState(false);
  const [procesandoExcel, setProcesandoExcel] = useState(0);
  const [totalCircuitos, setTotalCircuitos] = useState(0);
  const [circuitosProcesados, setCircuitosProcesados] = useState(0);
  const [modoAnguloRecto, setModoAnguloRecto] = useState(false);
  const [selectorPos, setSelectorPos] = useState(null); // posición del panel flotante
  const [selectorEnd, setSelectorEnd] = useState(null); // info del extremo seleccionad
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [addingSPL, setAddingSPL] = useState(false);
  const [modoModificarExtremos, setModoModificarExtremos] = useState(false);
  const [importedFileName, setImportedFileName] = useState(null);
  const [tablaMenu, setTablaMenu] = useState(false);
  const [filas, setFilas] = useState(5);
  const [columnas, setColumnas] = useState(3);
  const [tempNewLineDetails, setTempNewLineDetails] = useState(null);
  const [connectorAngleData, setConnectorAngleData] = useState({
  lineIndex: null, // Índice de la línea que contiene el conector
  end: null,       // 'p1' o 'p2'
  data: [],        // Array bidimensional para el contenido de la tabla
  filas: 5,        // Filas específicas de este conector
  columnas: 3,     // Columnas específicas de este conector
  generalDeduce: '',
  columnDeduce: [],
});

  const [drawingStep, setDrawingStep] = useState(0); 
  const [tempObj1Type, setTempObj1Type] = useState('Ninguno'); 

  //  Nuevo estado para el menú flotante contextual
  const [floatingMenu, setFloatingMenu] = useState(null);
  const [menuValues, setMenuValues] = useState({ name: '', deduce: '' });
  
  //  Nueva referencia para el contenedor principal
  const containerRef = useRef(null);
  
  //  Estados para la funcionalidad de deshacer
  const [history, setHistory] = useState([[]]);
  const [historyStep, setHistoryStep] = useState(0);

  //  Nuevo estado para la línea temporal del SPL
  const [tempSPL, setTempSPL] = useState(null);
  
  //  NUEVO ESTADO: Distancia de propagación configurable
  const [propagationDistance, setPropagationDistance] = useState(5);


  //  Nueva función para manejar el historial y los cambios de estado
  const handleStateChange = (newLines) => {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(newLines);
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
      setLines(newLines);
  };
  
  // ✅ Nueva función para deshacer
  const handleUndo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      setLines(history[newStep]);
    }
  };

  const botonBase = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  overflow: 'hidden',
  transition: 'width 0.3s ease',
  whiteSpace: 'nowrap',
  padding: '5px',
  border: '1px solid gray',
  borderRadius: '5px',
  backgroundColor: '#f0f0f0',
  cursor: 'pointer'
};
  
const spinnerStyle = {
  border: '4px solid #f3f3f3',
  borderTop: '4px solid #3f51b5',
  borderRadius: '50%',
  width: '30px',
  height: '30px',
  animation: 'spin 1s linear infinite',
  margin: '10px auto'
};

const renderTablaMenu = () => {
  if (!tablaMenu) return null;

  const { lineIndex, end, data, filas, columnas } = connectorAngleData;
  if (lineIndex === null) return null;

  const standardColumnWidth = '40px';
  const smallFontSize = '9px';
  const tableFontFamily = 'Arial, sans-serif'; // Fuente moderna

  const tableStyle = {
    borderCollapse: 'collapse',
    width: '100%',
    fontFamily: tableFontFamily,
  };

  const cellStyle = {
    border: '1px solid black',
    padding: '3px',
    textAlign: 'center',
    fontSize: smallFontSize,
    width: standardColumnWidth,
    height: '14px', // Altura fija de 30px
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  };

  const firstColumnStyle = {
    border: '1px solid black',
    padding: '1px',
    textAlign: 'center',
    fontSize: '20px',
    width: '40px',
    overflow: 'hidden',
    backgroundColor: '#F0FFF0',
    fontWeight: 'bold',   
  };

  const nameCellStyle = {
    ...cellStyle,
    backgroundColor: '#F0FFF0',
    height: '14px', // Altura fija de 30px
  };

  const numericCellStyle = {
    ...cellStyle,
    backgroundColor: '#d3d3d3',
    fontWeight: 'bold',
  };

  const inputStyle = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    border: 'none',
    textAlign: 'center',
    backgroundColor: 'transparent',
    fontSize: smallFontSize,
    fontFamily: tableFontFamily,
    MozAppearance: 'textfield',
  };

    const webkitInputStyle = {
    ...inputStyle,
    WebkitAppearance: 'none',
    margin: 0,
  };
  const handleColumnDeduceChange = (colIndex, value) => {
      // Opcional: acepta solo números
      const numericValue = value.replace(/[^0-9]/g, ''); 
      setConnectorAngleData(prev => {
          const newDeduce = [...prev.columnDeduce];
          newDeduce[colIndex] = numericValue;
          return { ...prev, columnDeduce: newDeduce };
      });
  };
  
  const handleDataChange = (rowIndex, colIndex, value) => {
      // Función para actualizar un valor específico de la tabla
      const newData = JSON.parse(JSON.stringify(data)); // Copia profunda
      if (!newData[rowIndex]) newData[rowIndex] = [];
      newData[rowIndex][colIndex] = value;
      setConnectorAngleData(prev => ({ ...prev, data: newData }));
  };
  
  // Función para actualizar el valor general (ej. el que está en vertical)
  const handleGeneralDeduceChange = (value) => {
      const numericValue = value.replace(/[^0-9.]/g, '');
      setConnectorAngleData(prev => ({ ...prev, generalDeduce: value }));
  };
  
  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      border: '1px solid gray',
      borderRadius: '10px',
      boxShadow: '4px 4px 15px rgba(0,0,0,0.4)',
      zIndex: 200,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      minWidth: '400px',
      maxWidth: '600px',
      fontFamily: tableFontFamily, // Fuente para el contenedor exterior
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%'
      }}>
        <button
          onClick={() => setTablaMenu(false)}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0',
            lineHeight: '1',
            alignSelf: 'flex-end',
            fontFamily: tableFontFamily,
          }}
        >
          &times;
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexGrow: 1 }}>
        {/* Tabla a la izquierda */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <table style={tableStyle}>
            <tbody>
              {/* Fila de Nombres */}
              <tr>
                <td style={{ ...cellStyle, border: 'none' }}></td>
                {Array.from({ length: columnas - 1 }).map((_, colIndex) => (
                  <td key={colIndex} style={nameCellStyle}>
                   <input 
                      type="text" 
                      // ✅ CONECTADO: Usar el valor del estado
                      value={connectorAngleData.columnDeduce[colIndex] || ''} 
                      // ✅ CONECTADO: Llamar al handler al escribir
                      onInput={(e) => handleColumnDeduceChange(colIndex, e.target.value)}
                      style={inputStyle} 
                    />
                  </td>
                ))}
              </tr>
              {/* Filas de datos y columna "Deduce General" */}
              {Array.from({ length: filas }).map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {rowIndex === 0 && (
                    <td rowSpan={filas} style={{...firstColumnStyle, verticalAlign: 'middle', borderRight: 'none', writingMode: 'vertical-lr', textOrientation: 'upright'}}>
                      <input 
                        type="text" 
                        placeholder="Deduce General" 
                        value={connectorAngleData.generalDeduce || ''}
                        onInput={(e) => handleGeneralDeduceChange(e.target.value)} 
                        style={{...inputStyle, writingMode: 'initial', textOrientation: 'initial', height: '100%', width: '100%'}} />
                    </td>
                  )}
                  {Array.from({ length: columnas - 1 }).map((_, colIndex) => (
                    <td key={colIndex} style={cellStyle}>
                      <input 
                          type="text"
                          value={data[rowIndex]?.[colIndex] || ''}
                          onInput={(e) => {
                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                            handleDataChange(rowIndex, colIndex, rawValue);
                            }}
                          style={inputStyle}
                        />
                    </td>
                  ))}
                </tr>
              ))}
              {/* Fila numérica */}
              <tr>
                <td style={{ ...numericCellStyle, border: 'none' }}></td>
                {Array.from({ length: columnas - 1 }).map((_, colIndex) => (
                  <td key={colIndex} style={numericCellStyle}>
                    {colIndex + 1}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Controles a la derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Filas</label>
            <div style={{ display: 'flex', gap: '5px' }}>
  <button onClick={() => setConnectorAngleData(prev => ({ ...prev, filas: prev.filas > 1 ? prev.filas - 1 : 1 }))}>-</button>
  <button onClick={() => setConnectorAngleData(prev => ({ ...prev, filas: prev.filas + 1 }))}>+</button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Columnas</label>
            <div style={{ display: 'flex', gap: '5px' }}>
  <button onClick={() => setConnectorAngleData(prev => ({ ...prev, columnas: prev.columnas > 1 ? prev.columnas - 1 : 1 }))}>-</button>
  <button onClick={() => setConnectorAngleData(prev => ({ ...prev, columnas: prev.columnas + 1 }))}>+</button>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
        <button onClick={() => {
    // 1. Crear el objeto de datos a guardar
    const { lineIndex, end, data, filas, columnas, generalDeduce } = connectorAngleData;

    if (lineIndex === null || end === null) {
      setTablaMenu(false);
      return;
    }

    const { lineIndex, end, data, filas, columnas, generalDeduce, columnDeduce } = connectorAngleData;

      if (lineIndex === null || end === null) {
    setTablaMenu(false);
    return;
  }

  // ✅ Incluir columnDeduce en el objeto que se guarda en la línea
  const newAngleData = { data, filas, columnas, generalDeduce, columnDeduce }; 
  
    const updatedLines = [...lines];
    
    if (end === 'p1') {
      updatedLines[lineIndex].angle_data1 = newAngleData;
    } else {
      updatedLines[lineIndex].angle_data2 = newAngleData;
    }

    // 3. Guardar el estado
    handleStateChange(updatedLines); 
    
    // 4. Resetear y cerrar
    setTablaMenu(false);
    setConnectorAngleData({ lineIndex: null, end: null, data: [], filas: 5, columnas: 3, generalDeduce: '', columnDeduce: [] });
  }}>Agregar ángulo</button>
          <button onClick={() => {
    setTablaMenu(false);
    setConnectorAngleData({ lineIndex: null, end: null, data: [], filas: 5, columnas: 3, generalDeduce: '', columnDeduce: [] }); // Resetear al cancelar
  }}>
    Cancelar
  </button>
      </div>
    </div>
  );
};

const botonExpandido = {
  width: '150px'
};
  const handleMouseDown = (e) => {
  if (e.evt.button === 1) { // botón central (scroll)
    setIsPanning(true);
    setLastPos({ x: e.evt.clientX, y: e.evt.clientY });
  }
};

const handleMouseUp = (e) => {
  if (e.evt.button === 1) {
    setIsPanning(false);
  }
};

useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setPoints([]);       // borra puntos en espera
      setTempLine(null);   // limpia la línea temporal
      setMousePos(null);   // quita el preview
      setShowInput(false); // oculta el input flotante de dimensión
      setFloatingMenu(null); // Oculta el menú flotante
      setTempSPL(null); // Limpia la vista previa del SPL
      if (pencilMode) {
        cancelDrawing();
      }
    }
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, []);


const handleMouseMovePan = (e) => {
  if (!isPanning) return;
  const stage = e.target.getStage();
  const dx = e.evt.clientX - lastPos.x;
  const dy = e.evt.clientY - lastPos.y;

  stage.x(stage.x() + dx);
  stage.y(stage.y() + dy);
  stage.batchDraw();

  setLastPos({ x: e.evt.clientX, y: e.evt.clientY });
};

  const getRelativePointerPosition = (stage) => {
  const transform = stage.getAbsoluteTransform().copy();
  transform.invert();
  const pos = stage.getPointerPosition();
  return transform.point(pos);
};

// proyecta un punto `pos` sobre el segmento p1-p2 y devuelve {x,y,t} donde t es 0..1
function projectPointOnLine(p1, p2, pos) {
  const A = { x: p1.x, y: p1.y };
  const B = { x: p2.x, y: p2.y };
  const P = { x: pos.x, y: pos.y };

  const AB = { x: B.x - A.x, y: B.y - A.y };
  const AP = { x: P.x - A.x, y: P.y - A.y };

  const ab2 = AB.x * AB.x + AB.y * AB.y;
  if (ab2 === 0) return { x: A.x, y: A.y, t: 0 };

  const ap_ab = AP.x * AB.x + AP.y * AB.y;
  let t = ap_ab / ab2;
  t = Math.max(0, Math.min(1, t));

  return { x: A.x + AB.x * t, y: A.y + AB.y * t, t };
}

// busca el segmento (línea) más cercano al punto `pos`.
// devuelve { lineIndex, proj: {x,y,t}, distance } o null si no hay líneas
function findClosestSegment(pos) {
  if (!lines || lines.length === 0) return null;
  let best = null;
  lines.forEach((line, idx) => {
    // línea p1-p2 (todavía modelada en tu app original)
    const proj = projectPointOnLine(line.p1, line.p2, pos);
    const dist = Math.hypot(proj.x - pos.x, proj.y - pos.y);
    if (!best || dist < best.distance) {
      best = { lineIndex: idx, proj, distance: dist, line };
    }
  });
  return best;
}
const cancelDrawing = () => {
    // 1. Resetear el paso de dibujo a 0 (listo para empezar)
    setDrawingStep(0); 
    
    // 2. Limpiar los puntos temporales
    setPoints([]); 
    
    // 3. Ocultar y limpiar el menú flotante (Extremo 1 y 2)
    setFloatingMenu(null); 
    
    // 4. Ocultar y limpiar el menú de dimensión (si está visible)
    setShowInput(false); 
    setDimension('');
    
    // 5. Limpiar la línea temporal
    setTempLine(null); 
    
    // 6. Restablecer el mensaje de estado
    setStatusMessage('Listo para dibujar una nueva línea.');
};

const handleDeleteSPL = () => {
  if (!floatingMenu) return;

  const { lineIndex, end } = floatingMenu;
  const targetLine = lines[lineIndex];
  const splPoint = targetLine[end];

  // Busca la otra línea que comparte el mismo punto SPL
  const otherLineIndex = lines.findIndex((line, idx) => {
    if (idx === lineIndex) return false;
    // ✅ CORREGIDO: Usando 'propagationDistance' en lugar de 'proximityThreshold'
    const p1Matches = Math.hypot(line.p1.x - splPoint.x, line.p1.y - splPoint.y) < propagationDistance;
    const p2Matches = Math.hypot(line.p2.x - splPoint.x, line.p2.y - splPoint.y) < propagationDistance;
    return p1Matches || p2Matches;
  });

  if (otherLineIndex === -1) {
    console.warn("No se encontró la otra parte del SPL.");
    setFloatingMenu(null);
    return;
  }

  const otherLine = lines[otherLineIndex];
  
  // Identifica los puntos que NO son el SPL para cada una de las dos líneas
  const nonSPLPoint1 = end === 'p1' ? targetLine.p2 : targetLine.p1;
  const nonSPLName1 = end === 'p1' ? targetLine.nombre_obj2 : targetLine.nombre_obj1;
  const nonSPLDeduce1 = end === 'p1' ? targetLine.deduce2 : targetLine.deduce1;
  const nonSPLObj1 = end === 'p1' ? targetLine.obj2 : targetLine.obj1;
  
  const isOtherLineP1SPL = Math.hypot(otherLine.p1.x - splPoint.x, otherLine.p1.y - splPoint.y) < propagationDistance;
  const nonSPLPoint2 = isOtherLineP1SPL ? otherLine.p2 : otherLine.p1;
  const nonSPLName2 = isOtherLineP1SPL ? otherLine.nombre_obj2 : otherLine.nombre_obj1;
  const nonSPLDeduce2 = isOtherLineP1SPL ? otherLine.deduce2 : otherLine.deduce1;
  const nonSPLObj2 = isOtherLineP1SPL ? otherLine.obj2 : otherLine.obj1;

  // Crea la nueva línea fusionada
  const mergedLine = {
    p1: nonSPLPoint1,
    p2: nonSPLPoint2,
    obj1: nonSPLObj1,
    obj2: nonSPLObj2,
    nombre_obj1: nonSPLName1,
    nombre_obj2: nonSPLName2,
    dimension_mm: (parseFloat(targetLine.dimension_mm) || 0) + (parseFloat(otherLine.dimension_mm) || 0),
    deduce1: nonSPLDeduce1,
    deduce2: nonSPLDeduce2,
    item: targetLine.item || otherLine.item
  };

  // Filtra las dos líneas antiguas y agrega la nueva
  const updatedLines = lines.filter((_, idx) => idx !== lineIndex && idx !== otherLineIndex);
  handleStateChange([...updatedLines, mergedLine]);
  setFloatingMenu(null);
};

  const [hoverBoton, setHoverBoton] = useState(null);


  // ✅ Usando la nueva variable de estado
  // const proximityThreshold = 35;

  const getClosestEndpoint = (pos) => {
    let closest = null;
    let minDist = Infinity;

    lines.forEach((line) => {
      ['p1', 'p2'].forEach((end) => {
        const point = line[end];
        const objType = line[end === 'p1' ? 'obj1' : 'obj2'];
        const dist = Math.hypot(pos.x - point.x, pos.y - point.y);
        // ✅ Usando la nueva variable de estado
        if (dist < propagationDistance && dist < minDist) {
          closest = { point, objType }; 
          minDist = dist;
        }
      });
    });

    return closest;
  };

const handleStageClick = (e) => {
  if (e.evt.button !== 0) return; // solo click izquierdo

  const stage = e.target.getStage();
  const pos = getRelativePointerPosition(stage);
  const containerRect = containerRef.current.getBoundingClientRect();

  // Variables para la posición del menú flotante
const menuX = (e.evt.clientX - containerRect.left) + 10;
const menuY = (e.evt.clientY - containerRect.top) + 10;

  // 1. Lógica de AGREGAR SPL (Máxima Prioridad)
  if (addingSPL) {
    e.cancelBubble = true;

    // Caso 1: Clic en un SEGMENTO de línea (tempSPL está activo) -> DIVIDIR LA LÍNEA
    if (tempSPL) {
        
      const { lineIndex, proj, original, dim1, dim2 } = tempSPL;
      
      // Creamos la primera nueva línea (p1 original -> SPL)
      const lineA = {
        p1: { ...original.p1 },
        p2: { x: proj.x, y: proj.y },
        obj1: original.obj1,
        obj2: 'SPL', // El nuevo punto es SPL
        nombre_obj1: original.nombre_obj1 || '',
        nombre_obj2: 'SPL', 
        dimension_mm: dim1, // Nueva dimensión calculada
        deduce1: original.deduce1 || '',
        deduce2: '',
        item: original.item || null
      };
      
      // Creamos la segunda nueva línea (SPL -> p2 original)
      const lineB = {
        p1: { x: proj.x, y: proj.y },
        p2: { ...original.p2 },
        obj1: 'SPL', // El nuevo punto es SPL
        obj2: original.obj2,
        nombre_obj1: 'SPL', 
        nombre_obj2: original.nombre_obj2 || '',
        dimension_mm: dim2, // Nueva dimensión calculada
        deduce1: '',
        deduce2: original.deduce2 || '',
        item: original.item || null
      };

      const updated = [...lines];
      // Reemplaza la línea original con las dos nuevas líneas (A y B)
      updated.splice(lineIndex, 1, lineA, lineB); 
      
      handleStateChange(updated);
      setAddingSPL(false);
      setTempSPL(null); // Limpia el estado de vista previa
      setStatusMessage('🔺 SPL insertado y línea dividida correctamente.');
      return; // ⬅️ Salimos para evitar ejecutar la lógica de dibujo
    }
      
    // Caso 2: Clic sobre un extremo existente (Para cambiar su tipo a SPL)
    if (e.target.attrs.id && (e.target.attrs.id.startsWith('point') || e.target.attrs.id.startsWith('label'))) {
      const lineIndex = e.target.attrs.id.startsWith('point') ? e.target.attrs.lineIndex : e.target.parent.attrs.lineIndex;
      const endType = e.target.attrs.id.startsWith('point') ? e.target.attrs.endType : e.target.parent.attrs.endType;

      const updatedLines = [...lines];
      const line = updatedLines[lineIndex];

      if (endType === 'p1') {
        line.obj1 = 'SPL';
      } else {
        line.obj2 = 'SPL';
      }

      handleStateChange(updatedLines);
      setAddingSPL(false);
      setTempSPL(null); 
      setStatusMessage('Extremo existente marcado como SPL.');
      return; // ⬅️ Salimos para evitar ejecutar la lógica de dibujo
    }

    // Caso 3: Clic en el lienzo (fondo) -> CANCELAR el modo SPL
    setStatusMessage('⚠️ Modo SPL cancelado.');
    setAddingSPL(false);
    setTempSPL(null); 
    return; // ⬅️ Salimos para evitar ejecutar la lógica de dibujo
  }

  // --- Lógica de Goma (EraserMode) (Prioridad 2) ---
  if (eraserMode) {
    if (e.target.attrs.id && e.target.attrs.id.startsWith('line-')) {
      const index = e.target.attrs.lineIndex;
      const updatedLines = lines.filter((_, i) => i !== index);
      handleStateChange(updatedLines);
      setStatusMessage('➖ Línea eliminada.');
    }
    return;
  }
    
  // --- Lógica del Lápiz (PencilMode) (Prioridad 3) ---
  if (pencilMode) {

    // **1. DETECCIÓN DE PUNTO DE INICIO (drawingStep === 0)**
    if (drawingStep === 0) {
      const snap = getClosestEndpoint(pos); // Devuelve { point, objType }

      if (snap) {
        // Clic sobre un extremo existente: BRK o Conector (conexión automática)
        if (snap.objType === 'BRK' || snap.objType === 'Conector') {
          setPoints([snap.point]); 
          setTempObj1Type('Ninguno'); 
          setStatusMessage(`Extremo inicial conectado a ${snap.objType}. Continúe con el punto final.`);
          setDrawingStep(2); 
          return; 
        }
      }
      
      // Lógica de mostrar el menú
      const startPoint = snap ? snap.point : pos;
      setPoints([startPoint]);

      setFloatingMenu({ x: menuX, y: menuY, step: 1, pos: startPoint });
      setStatusMessage('Seleccione el tipo para el Extremo 1 (Inicio de la línea).');
      setDrawingStep(1); // Esperando la selección del tipo de Extremo 1
    } 
    
    // **2. PROCESAR EL SEGUNDO CLIC (drawingStep === 2)**
    else if (drawingStep === 2) { 
      let adjustedPos = { ...pos };
      
      // Aplicar Modo Ángulo Recto si está activo
      if (modoAnguloRecto) {
        const p1 = points[0];
        const dx = Math.abs(pos.x - p1.x);
        const dy = Math.abs(pos.y - p1.y);
        if (dx > dy) {
          adjustedPos.y = p1.y; // Horizontal
        } else {
          adjustedPos.x = p1.x; // Vertical
        }
      }
      
      const snap = getClosestEndpoint(adjustedPos);
      let p2Pos = adjustedPos;
      
      if(snap) {
        p2Pos = snap.point;
        // Lógica de autocompletar si se conecta a un BRK/Conector
        if (snap.objType === 'BRK' || snap.objType === 'Conector') {
            const [p1] = points;
            const newLine = {
                p1: p1,
                p2: p2Pos,
                obj1: tempObj1Type,
                obj2: snap.objType,
                nombre_obj1: menuValues.name || '',
                nombre_obj2: '',
                dimension_mm: Math.hypot(p2Pos.x - p1.x, p2Pos.y - p1.y).toFixed(2),
                deduce1: menuValues.deduce || '',
                deduce2: '',
                item: null,
                angle_data1: null, 
                angle_data2: null,
            };
            handleStateChange([...lines, newLine]);
            setPoints([]);
            setTempLine(null);
            setDrawingStep(0);
            setFloatingMenu(null);
            setStatusMessage(`✅ Línea completada y conectada a ${snap.objType}.`);
            return;
        }
      }
      
      // Muestra el menú para el Extremo 2 (Si no se autocompletó)
      setPoints([points[0], p2Pos]);
      
      setFloatingMenu({ x: menuX, y: menuY, step: 2, pos: p2Pos, snap: !!snap }); 
      setStatusMessage('Seleccione el tipo para el Extremo 2 (Fin de la línea).');
      setDrawingStep(3); 
      setMousePos(null); 
    }
  }

  // 4. Lógica de selección/modificación (Se ejecuta si no hay modos especiales activos)
  setSelectorPos(null);
  setSelectorEnd(null);
};

const handleMouseMove = (e) => {
  const stage = e.target.getStage();
  const pos = getRelativePointerPosition(stage);

  if (addingSPL) {
    const found = findClosestSegment(pos);
    const proximityPx = 15; // Aumentar un poco el umbral para facilitar la selección

    if (!found || found.distance > proximityPx) {
      setTempSPL(null);
      return;
    }

    const { proj, line } = found;
    const totalDim = parseFloat(line.dimension_mm) || Math.hypot(line.p2.x - line.p1.x, line.p2.y - line.p1.y);
    const dim1 = Math.round(totalDim * proj.t);
    const dim2 = Math.round(totalDim * (1 - proj.t));

    // Si el mouse está lo suficientemente cerca, actualiza la línea temporal
    setTempSPL({
      lineIndex: found.lineIndex,
      proj,
      original: line,
      dim1,
      dim2
    });

  } else if (pencilMode && drawingStep === 2 && points.length === 1 && !eraserMode) { // MODIFICADO: Añadir drawingStep === 2
    const p1 = points[0];
    let adjustedPos = { ...pos };

    if (modoAnguloRecto) {
      const dx = Math.abs(pos.x - p1.x);
      const dy = Math.abs(pos.y - p1.y);
      if (dx > dy) {
        adjustedPos.y = p1.y; // Horizontal
      } else {
        adjustedPos.x = p1.x; // Vertical
      }
    }
    setMousePos(adjustedPos);
  } else {
    setTempSPL(null);
  }
};

const confirmDimension = () => {
  if (!tempNewLineDetails) return; // Evita errores si no hay datos pendientes

  // 1. Crear la línea final con la dimensión ingresada
 const finalDimension = parseFloat(dimension).toFixed(0); 
  const newLine = {
    ...tempNewLineDetails,
    dimension_mm: finalDimension, // Usar el valor ingresado por el usuario
  };

  // 2. Dibujar la línea
  handleStateChange([...lines, newLine]);

  // 3. Resetear todos los estados de dibujo
  setPoints([]);
  setTempLine(null);
  setDrawingStep(0);
  setShowInput(false); // Oculta el menú
  setDimension(''); // Limpia el input
  setTempNewLineDetails(null); // Limpia los detalles temporales
  setStatusMessage(`✅ Línea completada y dibujada con dimensión ${finalDimension}mm.`);
};

// ✅ ELIMINADA LA FUNCION updateNombre, su logica se mueve a handleUpdateFloatingMenu

  const handleLineClick = (index) => {
    if (eraserMode) {
      const updatedLines = [...lines];
      updatedLines.splice(index, 1);
      handleStateChange(updatedLines);
    }
  };
const calcularRuta = (start, end) => {
  const graph = {};
  lines.forEach((line) => {
    const { nombre_obj1, nombre_obj2, dimension_mm } = line;
    const dimension = parseFloat(dimension_mm);
    
    if (!nombre_obj1 || !nombre_obj2 || isNaN(dimension) || dimension <= 0) return;
    if (!graph[nombre_obj1]) graph[nombre_obj1] = {};
    if (!graph[nombre_obj2]) graph[nombre_obj2] = {};
    graph[nombre_obj1][nombre_obj2] = dimension;
    graph[nombre_obj2][nombre_obj1] = dimension;
  });

  const distances = {};
  const prev = {};
  const visited = new Set();
  const queue = [];

  for (const node in graph) {
    distances[node] = Infinity;
  }
  distances[start] = 0;
  queue.push({ node: start, dist: 0 });

  while (queue.length > 0) {
    queue.sort((a, b) => a.dist - b.dist);
    const { node } = queue.shift();
    if (visited.has(node)) continue;
    visited.add(node);

    for (const neighbor in graph[node]) {
      const newDist = distances[node] + graph[node][neighbor];
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        prev[neighbor] = node;
        queue.push({ node: neighbor, dist: newDist });
      }
    }
  }

  return distances[end] !== Infinity ? { distance: distances[end] } : null;
};
  
  
  
const calcularRutaReal = () => {
  const graph = {};

  lines.forEach((line) => {
    const { nombre_obj1, nombre_obj2, dimension_mm } = line;
    const dimension = parseFloat(dimension_mm);
    
    if (!nombre_obj1 || !nombre_obj2 || isNaN(dimension) || dimension <= 0) return;

    if (!graph[nombre_obj1]) graph[nombre_obj1] = {};
    if (!graph[nombre_obj2]) graph[nombre_obj2] = {};

    graph[nombre_obj1][nombre_obj2] = dimension; 
    graph[nombre_obj2][nombre_obj1] = dimension;
  });

  const dijkstra = (start, end) => {
    const distances = {};
    const prev = {};
    const visited = new Set();
    const queue = [];

    for (const node in graph) {
      distances[node] = Infinity;
    }
    distances[start] = 0;
    queue.push({ node: start, dist: 0 });

    while (queue.length > 0) {
      queue.sort((a, b) => a.dist - b.dist);
      const { node } = queue.shift();
      if (visited.has(node)) continue;
      visited.add(node);

      for (const neighbor in graph[node]) {
        const newDist = distances[node] + graph[node][neighbor];
        if (newDist < distances[neighbor]) {
          distances[neighbor] = newDist;
          prev[neighbor] = node;
          queue.push({ node: neighbor, dist: newDist });
          }
        }
      }

    const path = [];
    let current = end;
    while (current) {
      path.unshift(current);
      current = prev[current];
    }

    return distances[end] !== Infinity ? { distance: distances[end], path } : null;
  };

  // ✅ Corrección aquí
  const result = dijkstra(nameInput1, nameInput2);

if (!graph[nameInput1] || !graph[nameInput2]) {
  alert("⚠️ Uno o ambos extremos no existen en el plano.");
  setDistanciaRuta(null);
  setRutaCalculada([]);
  return;
}

if (!result || !result.path || result.path.length === 0) {
  alert("⚠️ No hay ruta entre los objetos ingresados.");
  setDistanciaRuta(null);
  setRutaCalculada([]);
  return;
}

setDistanciaRuta(result.distance);
setRutaCalculada(result.path);

};

  
 const handleResetApp = () => {
  const confirmation = window.confirm("¿Quieres limpiar el dibujo por completo? No se guardará ningún cambio.");

  if (confirmation) {
    handleStateChange([]);
    setPoints([]);
    setObj1('Ninguno');
    setObj2('Ninguno');
    setDimension('');
    setInputPos({ x: 0, y: 0 });
    setShowInput(false);
    setTempLine(null);
    setMousePos(null);
    setHoveredObj(null);
    setSelectedEnd(null);
    setNameInput('');
    setEraserMode(false);
    setNameInput1('');
    setNameInput2('');
    setDistanciaRuta(null);
    setRutaCalculada([]);
    setPencilMode(true);
    setStatusMessage('');
    setArchivoProcesado(false);
    setFloatingMenu(null);
    // Nuevos estados añadidos
    setModoModificarExtremos(false);
    setAddingSPL(false);
    setTempSPL(null);
    setHistory([[]]);
    setHistoryStep(0);
    setImportedFileName(null);
    setMostrarCalculadora(false);
    setMostrarExtremos(false);
    setMostrarExcel(false);
    setTotalCircuitos(0);
    setCircuitosProcesados(0);
    setProcesandoExcel(false);
  }
};

   const handleGuardar = () => {
       const data = JSON.stringify(lines);
       const blob = new Blob([data], { type: 'application/json' });
       saveAs(blob, 'dibujo_guardado.json');
   };

   const handleAbrir = (event) => {
       const file = event.target.files[0];
       if (!file) return;
       const reader = new FileReader();
       reader.onload = (e) => {
           try {
               const contenido = JSON.parse(e.target.result);
               handleStateChange(contenido);
               setStatusMessage('✅ Archivo cargado correctamente.');
           } catch (error) {
               setStatusMessage('❌ Error al cargar el archivo.');
           }
       };
       reader.readAsText(file);
   };

const handleImportExcel = (e) => {
  setProcesandoExcel(true);

  const file = e.target.files[0];
  if (!file) return;

  setImportedFileName(file.name);

  const reader = new FileReader();
  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const updatedSheet = [...jsonData];

    setTotalCircuitos(updatedSheet.length - 2);
    setCircuitosProcesados(0);

    if (updatedSheet[1]) {
      updatedSheet[1][22] = 'Dimension calculada';
      updatedSheet[1][23] = 'Ruta encontrada';
      updatedSheet[1][24] = 'Deduce Lado 1';
      updatedSheet[1][25] = 'Deduce Lado 2';
    }

    const graph = {};
    lines.forEach((line) => {
      const { nombre_obj1, nombre_obj2, dimension_mm } = line;
      const dimension = parseFloat(dimension_mm);
      
      if (!nombre_obj1 || !nombre_obj2 || isNaN(dimension) || dimension <= 0) return;
      if (!graph[nombre_obj1]) graph[nombre_obj1] = {};
      if (!graph[nombre_obj2]) graph[nombre_obj2] = {};
      graph[nombre_obj1][nombre_obj2] = dimension;
      graph[nombre_obj2][nombre_obj1] = dimension;
    });

    const dijkstra = (start, end) => {
      const distances = {};
      const visited = new Set();
      const queue = [];

      for (const node in graph) distances[node] = Infinity;
      distances[start] = 0;
      queue.push({ node: start, dist: 0 });

      while (queue.length > 0) {
        queue.sort((a, b) => a.dist - b.dist);
        const { node } = queue.shift();
        if (visited.has(node)) continue;
        visited.add(node);

        for (const neighbor in graph[node]) {
          const newDist = distances[node] + graph[node][neighbor];
          if (newDist < distances[neighbor]) {
            distances[neighbor] = newDist;
            queue.push({ node: neighbor, dist: newDist });
          }
        }
      }

      return distances[end] !== Infinity ? distances[end] : null;
    };

    let i = 2;
    const chunkSize = 100;

    const processChunk = () => {
      const end = Math.min(i + chunkSize, updatedSheet.length);
      for (; i < end; i++) {
        try {
          const row = updatedSheet[i];
          const to_item = row[8];
          const from_item = row[15];

          if (!from_item || !to_item) {
            updatedSheet[i][22] = 'Extremos faltantes';
            updatedSheet[i][23] = 'No';
            continue;
          }

          const distancia = dijkstra(from_item, to_item);
          updatedSheet[i][24] = '';
          updatedSheet[i][25] = '';
          lines.forEach((line) => {
            const extremos = [
              { nombre: line.nombre_obj1, valor: parseFloat(line.deduce1) },
              { nombre: line.nombre_obj2, valor: parseFloat(line.deduce2) }
            ];
            extremos.forEach(({ nombre, valor }) => {
              if (nombre === from_item && !isNaN(valor)) updatedSheet[i][24] = valor;
              if (nombre === to_item && !isNaN(valor)) updatedSheet[i][25] = valor;
            });
          });

          if (distancia === null) {
            updatedSheet[i][22] = 'Ruta no encontrada';
            updatedSheet[i][23] = 'No';
            continue;
          }

          updatedSheet[i][22] = distancia;
          updatedSheet[i][23] = 'Sí';
        } catch (error) {
          updatedSheet[i][22] = 'Error en fila';
          updatedSheet[i][23] = 'No';
          console.error(`Error en fila ${i}:`, error);
        }
      }

      setCircuitosProcesados(i - 2);

      if (i < updatedSheet.length) {
        setTimeout(processChunk, 0);
      } else {
        const newWorksheet = XLSX.utils.aoa_to_sheet(updatedSheet);
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
        const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, importedFileName || 'resultado_procesado.xlsx');
        setProcesandoExcel(false);
        setImportedFileName(null);
        setTotalCircuitos(0);
        setCircuitosProcesados(0);
      }
    };

    processChunk();
  };
  reader.readAsArrayBuffer(file);
};
  
  const handleWheel = (e) => {
  e.evt.preventDefault();
  const stage = e.target.getStage();
  const oldScale = stage.scaleX();

  const scaleBy = 1.1; // factor de zoom
  const mousePointTo = {
    x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
    y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
  };

  const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
  stage.scale({ x: newScale, y: newScale });

  const newPos = {
    x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
    y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
  };
  stage.position(newPos);
  stage.batchDraw();
};

  

const handleExportExcel = () => {
  setStatusMessage('📤 Procesando archivo para exportar...');
  const exportData = lines.map((line, index) => ({
    item: index + 1,
    nombre_obj1: line.nombre_obj1,
    nombre_obj2: line.nombre_obj2,
    dimension_mm: parseFloat(line.dimension_mm || 0) + parseFloat(line.deduce || 0),
    deduce: line.deduce,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Líneas');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, 'resultado_procesado.xlsx');

  setStatusMessage('✅ Archivo listo para descargar.');
  setArchivoProcesado(false);
  setMostrarExcel(false);
  setStatusMessage('');

  // ✅ Nuevos estados añadidos
  setImportedFileName(null);
  setTotalCircuitos(0);
  setCircuitosProcesados(0);
  setProcesandoExcel(false);
};

const handleSelectEndType = (type) => {
  // 1. Manejar la selección del Extremo 1 (Paso inicial)
  if (floatingMenu && floatingMenu.step === 1) {
    setTempObj1Type(type); // Guarda el tipo de objeto para el Extremo 1
    setDrawingStep(2);      // Avanza el paso para que el siguiente clic sea el Extremo 2
    setFloatingMenu(null);  // Oculta el menú
    setStatusMessage(`Extremo 1 establecido como ${type}. Ahora haz clic para el Extremo 2.`);
  }

  // 2. Manejar la selección del Extremo 2 (Último paso antes de la dimensión)
  else if (floatingMenu && floatingMenu.step === 2) {
    const [p1, p2] = points;
    // const initialDimension = Math.hypot(p2.x - p1.x, p2.y - p1.y).toFixed(2);

    // 1. ALMACENA LOS DETALLES DE LA LÍNEA PENDIENTE DE DIMENSIÓN
    setTempNewLineDetails({
        p1: p1,
        p2: p2,
        obj1: tempObj1Type,
        obj2: type, // El tipo seleccionado para el Extremo 2
        nombre_obj1: menuValues.name || '',
        nombre_obj2: '',
        // ⚠️ IMPORTANTE: No se incluye 'dimension_mm' aquí.
        deduce1: menuValues.deduce || '',
        deduce2: '',
        item: null,
    });

    // 2. MUESTRA EL MENÚ DE INGRESO DE DIMENSIÓN
   // setDimension(initialDimension); // Pre-llena el input con la distancia calculada
    setDimension('');
    setInputPos({ x: floatingMenu.x, y: floatingMenu.y });   // Muestra el input cerca del extremo 2
    setShowInput(true);             // Muestra el menú de ingreso de dimensión

    // 3. Resetear el menú flotante
    setFloatingMenu(null);
    setStatusMessage('Ingrese la dimensión final de la línea y presione OK.');
  }
};

// ✅ Función para actualizar el menú flotante
const handleUpdateFloatingMenu = () => {
  if (!floatingMenu) return;
  const { lineIndex, end, type } = floatingMenu;
  const updatedLines = [...lines];
  const targetLine = updatedLines[lineIndex];

  const newName = menuValues.name;
  const newDeduce = menuValues.deduce;

  const targetPos = targetLine[end];

  // Lógica de actualización del extremo seleccionado
  if (end === 'p1') {
    targetLine.nombre_obj1 = newName;
    if (type === 'Conector' || type === 'SPL') {
      targetLine.deduce1 = newDeduce;
    }
  } else {
    targetLine.nombre_obj2 = newName;
    if (type === 'Conector' || type === 'SPL') {
      targetLine.deduce2 = newDeduce;
    }
  }
  
  // ✅ Lógica de PROPAGACIÓN unificada para todos los tipos
  // Busca otros extremos unidos en la misma posición
  updatedLines.forEach((line) => {
      const p1Proximity = Math.hypot(line.p1.x - targetPos.x, line.p1.y - targetPos.y);
      const p2Proximity = Math.hypot(line.p2.x - targetPos.x, line.p2.y - targetPos.y);
      
      if (p1Proximity < propagationDistance) {
          line.nombre_obj1 = newName;
      }
      if (p2Proximity < propagationDistance) {
          line.nombre_obj2 = newName;
      }
  });

  handleStateChange(updatedLines);
  setFloatingMenu(null);
};
  
  // ✅ Nueva función para renderizar el menú flotante
  const renderFloatingMenu = () => {
    if (!floatingMenu) return null;

    const { x, y, type, step } = floatingMenu;
    
    const commonProps = {
      position: 'absolute',
      left: x,
      top: y,
      backgroundColor: 'white',
      border: '1px solid gray',
      padding: '10px',
      borderRadius: '5px',
      boxShadow: '2px 2px 5px rgba(0,0,0,0.2)',
      zIndex: 100
    };

    const inputStyle = {
      width: '200px',
      marginBottom: '5px'
    };
    
    const labelStyle = {
      display: 'block',
      fontSize: '12px'
    };
        if (step === 1 || step === 2) { 
      return (
        <div style={commonProps}>
          <p>Seleccionar Tipo de Extremo {step}</p>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={() => handleSelectEndType('Conector')}>Conector</button>
            <button onClick={() => handleSelectEndType('BRK')}>BRK</button>
          </div>
          <button onClick={() => setFloatingMenu(null)} style={{ marginTop: '5px' }}>Cancelar</button>
        </div>
      );
    }

    switch (type) {
case 'SPL':
  return (
    <div style={commonProps}>
      <p>Modificar SPL</p>
      <label style={labelStyle}>Nombre:</label>
      <input type="text" style={inputStyle} value={menuValues.name} onChange={(e) => setMenuValues({ ...menuValues, name: e.target.value })} />
      <label style={labelStyle}>Deduce:</label>
      <input type="number" style={inputStyle} value={menuValues.deduce} onChange={(e) => setMenuValues({ ...menuValues, deduce: e.target.value })} />
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleUpdateFloatingMenu}>Actualizar</button>
        <button onClick={handleDeleteSPL} style={{ backgroundColor: 'lightcoral', marginLeft: '5px' }}>Eliminar SPL</button>
      </div>
      <button onClick={() => setFloatingMenu(null)} style={{ marginTop: '5px' }}>Cancelar</button>
    </div>
  );
case 'Conector':
  return (
    <div style={commonProps}>
      <p>Modificar Conector</p>
      <label style={labelStyle}>Nombre:</label>
      <input type="text" style={inputStyle} value={menuValues.name} onChange={(e) => setMenuValues({ ...menuValues, name: e.target.value })} />
      <label style={labelStyle}>Deduce:</label>
      <input type="number" style={inputStyle} value={menuValues.deduce} onChange={(e) => setMenuValues({ ...menuValues, deduce: e.target.value })} />
      <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
        <button onClick={handleUpdateFloatingMenu}>Actualizar</button>
        <button onClick={() => {
          setFloatingMenu(null);
          setTablaMenu(true);

          const line = lines[floatingMenu.lineIndex];
          const end = floatingMenu.end; // 'p1' o 'p2'
          
          const existingData = end === 'p1' ? line.angle_data1 : line.angle_data2;
          
          setConnectorAngleData({
              lineIndex: floatingMenu.lineIndex,
              end: end,
              // Carga los datos existentes, o usa valores predeterminados
              data: existingData?.data || [], 
              filas: existingData?.filas || 5,
              columnas: existingData?.columnas || 3,
              generalDeduce: existingData?.generalDeduce || '',
              columnDeduce: existingData?.columnDeduce || [],
          });
    
        }}>Agregar ángulo</button>
      </div>
      <button onClick={() => setFloatingMenu(null)} style={{ marginTop: '5px' }}>Cancelar</button>
    </div>
  );
      case 'BRK':
        return (
          <div style={commonProps}>
            <p>Modificar BRK</p>
            <label style={labelStyle}>Nombre:</label>
            <input type="text" style={inputStyle} value={menuValues.name} onChange={(e) => setMenuValues({ ...menuValues, name: e.target.value })} />
            <button onClick={handleUpdateFloatingMenu}>Actualizar</button>
            <button onClick={() => setFloatingMenu(null)}>Cancelar</button>
          </div>
        );
      default:
        return null;
    }
  };


  const renderObjeto = (tipo, x, y, key, index, end, line) => {
    const isHovered = hoveredObj === key;
    const commonProps = {
      key,
      onMouseEnter: () => setHoveredObj(key),
      onMouseLeave: () => setHoveredObj(null),
      onClick: (e) => {
        if (!eraserMode && !pencilMode) {
          e.cancelBubble = true; // Evita que el clic se propague al Stage
          
          // ✅ Nuevo: Obtener la posición del contenedor
          const containerRect = containerRef.current.getBoundingClientRect();
          
          // ✅ Nuevo: Calcular la posición del menú
          const menuX = e.evt.clientX - containerRect.left;
          const menuY = e.evt.clientY - containerRect.top;
          
          const name = end === 'p1' ? line.nombre_obj1 : line.nombre_obj2;
          const deduce = end === 'p1' ? line.deduce1 : line.deduce2;
          
          // ✅ Se usan las nuevas coordenadas calculadas
          setFloatingMenu({ x: menuX, y: menuY, lineIndex: index, end, type: tipo });
          setMenuValues({ name, deduce });
        }
      },
    };

    switch (tipo) {
      case 'Conector':{
        const hasAngleData = end === 'p1' ? !!line.angle_data1 : !!line.angle_data2;
                return (

          <Group x={x} y={y} {...commonProps}>
            {}
            <Rect 
              x={-5} y={-5} width={10} height={10} 
              fill={isHovered ? 'Lime' : 'DeepSkyBlue'}
              // Propiedades para identificar el objeto
              id={commonProps.key}
              lineIndex={index}
              endType={end}
            />

            {}
            {hasAngleData && (
              <RegularPolygon
                sides={4}          // Cuadrado
                radius={3}         // Tamaño pequeño
                fill="red"         // Color distintivo
                stroke="darkred"
                strokeWidth={0.5}
                rotation={45}      // Rota 45° para que parezca un diamante
                // **POSICIONAMIENTO:** // Lo movemos a la esquina inferior derecha del conector (10, 10)
                x={8} 
                y={8}
                // Hacemos que sea transparente a los clics
                listening={false} 
              />
            )}
          </Group>
        );
      }
        
      case 'BRK':
        return <Circle {...commonProps} x={x} y={y} radius={4} fill={isHovered ? 'Lime' : 'black'} />;
      case 'SPL': {
        const nombre = end === 'p1' ? line.nombre_obj1 : line.nombre_obj2;
        const radius = 9; // ✅ Círculo de tamaño fijo
        
        // **✅ Lógica de ajuste de fuente mejorada**
        let calculatedFontSize = 6;
        if (nombre.length > 3) {
            calculatedFontSize = Math.max(5, 6 - (nombre.length - 3) * 0.5);
        }

        return (
          // ✅ El Group se centra en la coordenada (x,y) de la línea
          <Group {...commonProps} x={x} y={y}>
            <Circle
              radius={radius}
              fill="white"
              stroke="red"
              strokeWidth={0.3}
            />
            <Text
              text={nombre}
              fontSize={calculatedFontSize} // ✅ Ahora usa el tamaño calculado
              fill="black"
              fontStyle="bold"
              width={radius * 2}
              height={radius * 2}
              align="center"
              verticalAlign="middle"
              offsetX={radius}
              offsetY={radius}
              wrap="none"
              ellipsis={false} // ✅ Desactiva la elipsis para que no trunque el texto
            />
          </Group>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      

<div style={{
  width: '350px',
  padding: '15px',
  backgroundColor: 'white',
  border: '2px solid gray',
  borderRadius: '15px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  fontFamily: 'Segoe UI, Roboto, sans-serif'
}}>

        <h3 style= {{ fontSize: '18px', textAlign: 'center' }}>Caculadora de dimensiones</h3>
        <hr style={{ borderTop: '1px solid lightgray', margin: '10px 0' }} />

      
<div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
    
    <button
  onMouseEnter={() => setHoverBoton('excel')}
  onMouseLeave={() => setHoverBoton(null)}
  onClick={() => setMostrarExcel(!mostrarExcel)}
  style={{
    ...botonBase,
    ...(hoverBoton === 'excel' ? botonExpandido : {})
  }}
>
  📁 {hoverBoton === 'excel' && 'Excel'}
</button>
  
  <button
  onMouseEnter={() => setHoverBoton('calculadora')}
  onMouseLeave={() => setHoverBoton(null)}
  onClick={() => setMostrarCalculadora(!mostrarCalculadora)}
  style={{
    ...botonBase,
    ...(hoverBoton === 'calculadora' ? botonExpandido : {})
  }}
>
  🧮 {hoverBoton === 'calculadora' && 'Calculadora'}
</button>
        
<button
  onMouseEnter={() => setHoverBoton('limpiar')}
  onMouseLeave={() => setHoverBoton(null)}
  onClick={handleResetApp}
  style={{
    ...botonBase,
    ...(hoverBoton === 'limpiar' ? botonExpandido : {})
  }}
>
  🧹 {hoverBoton === 'limpiar' && 'Limpiar'}
</button>
  </div>
  
<div style={{ marginTop: '10px' }}>
  <button
  onMouseEnter={() => setHoverBoton('Guardar')}
  onMouseLeave={() => setHoverBoton(null)}
  onClick={handleGuardar}
  style={{
    ...botonBase,
    ...(hoverBoton === 'Guardar' ? botonExpandido : {})
  }}
>
  💾 {hoverBoton === 'guardar' && 'Guardar'}
</button>

        
        <input
        type="file"
        id="abrirArchivo"
        accept="application/json"
        onChange={handleAbrir}
        style={{ display: 'none' }}
  />

        
<button
  onMouseEnter={() => setHoverBoton('abrir')}
  onMouseLeave={() => setHoverBoton(null)}
  onClick={() => document.getElementById('abrirArchivo').click()}
  style={{
    ...botonBase,
    ...(hoverBoton === 'abrir' ? botonExpandido : {})
  }}
>
  📁 {hoverBoton === 'abrir' && 'Abrir'}
</button>
  </div>
<hr style={{ borderTop: '1px solid lightgray', margin: '10px 0' }} />



        {true && (
          <>

              
            {mostrarCalculadora && (
  <>
    <h4 style= {{textAlign: 'center' }}>Calcular distancia por circuito</h4>
    <label style= {{fontSize: '12px'}}>Nombre extremo 1:  </label>
    <input type="text" value={nameInput1} onChange={(e) => setNameInput1(e.target.value)} />
    <br />
    <label style= {{fontSize: '12px'}}>Nombre extremo 2:  </label>
    <input type="text" value={nameInput2} onChange={(e) => setNameInput2(e.target.value)} />
    <br />
    <button onClick={calcularRutaReal}>Calcular ruta</button>
    {distanciaRuta !== null && (
      <p>📏 Distancia total: {distanciaRuta.toFixed(2)} mm<br />🧭 Ruta: {rutaCalculada.join(' → ')}</p>
    )}
  <hr style={{ borderTop: '1px solid lightgray', margin: '10px 0' }} />
  </>
)}


         
<h4 style={{textAlign: 'center'}}>Tabla de líneas dibujadas</h4>
<div style={{
  maxHeight: '300px',
  overflowY: 'auto',
  border: '1px solid #ccc',
  paddingRight: '5px'
}}>
  <table style={{
    width: '100%',
    fontSize: '11px',
    borderCollapse: 'collapse',
    textAlign: 'center',
    fontFamily: 'Segoe UI, Roboto, sans-serif',
    maxWidth: '280px'
  }}>
    <thead>
      <tr>
        <th style={{ backgroundColor: '#0022FF', color: 'white', border: '1px solid black', padding: '6px' }}>#</th>
        <th style={{ backgroundColor: '#0022FF', color: 'white', border: '1px solid black', padding: '6px' }}>Lado 1</th>
        <th style={{ backgroundColor: '#0022FF', color: 'white', border: '1px solid black', padding: '6px' }}>D1</th>
        <th style={{ backgroundColor: '#0022FF', color: 'white', border: '1px solid black', padding: '6px' }}>Lado 2</th>
        <th style={{ backgroundColor: '#0022FF', color: 'white', border: '1px solid black', padding: '6px' }}>D2</th>
        <th style={{ backgroundColor: '#0022FF', color: 'white', border: '1px solid black', padding: '6px' }}>Dim (mm)</th>
      </tr>
    </thead>
    <tbody>
      {lines.map((line, index) => (
        <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#f5f5f5' : 'white' }}>
          <td style={{ border: '1px solid gray' }}>{index + 1}</td>
          
<td style={{ border: '1px solid gray' }}>
  <input
    type="text"
    value={line.nombre_obj1}
    onChange={(e) => {
      const updated = [...lines];
      updated[index].nombre_obj1 = e.target.value;
      setLines(updated);
    }}
    style={{ width: '50px', textAlign: 'center' }}
  />
</td>

          <td style={{ border: '1px solid gray' }}>
            <input
              type="number"
              value={line.deduce1}
              onChange={(e) => {
                const updated = [...lines];
                updated[index].deduce1 = e.target.value;
                setLines(updated);
              }}
              style={{ width: '50px', textAlign: 'center' }}
            />
          </td>
          
<td style={{ border: '1px solid gray' }}>
  <input
    type="text"
    value={line.nombre_obj2}
    onChange={(e) => {
      const updated = [...lines];
      updated[index].nombre_obj2 = e.target.value;
      setLines(updated);
    }}
    style={{ width: '50px', textAlign: 'center' }}
  />
</td>

          <td style={{ border: '1px solid gray' }}>
            <input
              type="number"
              value={line.deduce2}
              onChange={(e) => {
                const updated = [...lines];
                updated[index].deduce2 = e.target.value;
                setLines(updated);
              }}
              style={{ width: '50px', textAlign: 'center' }}
            />
          </td>
          
<td style={{ border: '1px solid gray' }}>
  <input
    type="number"
    value={line.dimension_mm}
    onChange={(e) => {
      const updated = [...lines];
      updated[index].dimension_mm = e.target.value;
      setLines(updated);
    }}
    style={{ width: '50px', textAlign: 'center' }}
  />
</td>

        </tr>
      ))}
    </tbody>
  </table>
</div>
<hr style={{ borderTop: '1px solid lightgray', margin: '10px 0' }} />
          </>
        )}


        {mostrarExcel && (
  <>
    <h4 style= {{textAlign: 'center' }}>Importar / Exportar Excel</h4>
    <input type="file" accept=".xlsx" onChange={handleImportExcel} />
    <br /><br />
    <button onClick={handleExportExcel} disabled={lines.length === 0}>
      📤 Exportar archivo procesado
    </button>
    <br /><br />

        {procesandoExcel && (
  <div style={{ textAlign: 'center' }}>
    <div style={spinnerStyle}></div>
    <p style={{ fontStyle: 'italic', color: 'orange' }}>Procesando archivo Excel... Por favor espera.</p>
          
    <p style={{ fontStyle: 'italic', color: 'green' }}>
    Circuitos totales: {totalCircuitos} <br />
    Circuitos procesados: {circuitosProcesados}
</p>

  </div>
)}
<hr style={{ borderTop: '1px solid lightgray', margin: '10px 0' }} />

  </>
)}


  
      </div>

      <div style={{ position: 'relative' }} ref={containerRef}>
          
<div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
  
  <button
    onClick={handleUndo}
    disabled={historyStep === 0}
    style={{
      backgroundColor: historyStep > 0 ? 'white' : 'lightgray',
      border: '1px solid gray',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    🔙 Deshacer
  </button>
  <button
    onClick={() => setModoAnguloRecto(!modoAnguloRecto)}
    style={{
      backgroundColor: modoAnguloRecto ? 'Lime' : 'white',
      border: '1px solid gray',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    {modoAnguloRecto ? '🔒︎ Ángulo recto' : '🔓︎ Ángulo libre'}
  </button>

  <button
    onClick={() => setPencilMode(!pencilMode)}
    style={{
      backgroundColor: pencilMode ? 'Lime' : 'white',
      border: '1px solid gray',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    🖉 {pencilMode ? 'Desactivar lápiz' : 'Activar lápiz'}
  </button>

  <button
    onClick={() => setEraserMode(!eraserMode)}
    style={{
      backgroundColor: eraserMode ? 'Lime' : 'white',
      border: '1px solid gray',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    🧽 {eraserMode ? 'Desactivar borrador' : 'Activar borrador'}
  </button>
    
    <button
  onClick={() => setModoModificarExtremos(!modoModificarExtremos)}
  style={{
    backgroundColor: modoModificarExtremos ? 'Lime' : 'white',
    border: '1px solid gray',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: 'pointer'
  }}
>
  🔧 {modoModificarExtremos ? 'Modificar activos' : 'Modificar extremos'}
</button>
  <button
  onClick={() => {
    setAddingSPL(!addingSPL);
    setStatusMessage(!addingSPL ? 'Modo: colocar SPL activo' : '');
  }}
  style={{
    backgroundColor: addingSPL ? 'Lime' : 'white',
    border: '1px solid gray',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: 'pointer'
  }}
>
  🔺 {addingSPL ? 'SPL: ON' : 'Agregar SPL'}
</button>
</div>


  
<div
  id="canvas-container"
  style={{
    backgroundColor: 'white',
    border: '2px solid gray',
    borderRadius: '15px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    resize: 'both',
    overflow: 'hidden',
    width: canvasSize.width,
    height: canvasSize.height,
    minWidth: '400px',
    minHeight: '300px',
    maxWidth: '1800px',
    maxHeight: '1500px'
  }}
  onMouseUp={(e) => {
  const container = document.getElementById('canvas-container');
  if (container) {
    const newWidth = container.offsetWidth;
    const newHeight = container.offsetHeight;

    // Detecta si el mouse se soltó en el borde inferior derecho (zona de resize)
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const rect = container.getBoundingClientRect();

    const isNearResizeCorner =
      mouseX >= rect.right - 20 && mouseY >= rect.bottom - 20;

    if (isNearResizeCorner) {
      setCanvasSize({
        width: newWidth,
        height: newHeight
      });
    }
  }
}}
>
  <Stage
  width={canvasSize.width}
  height={canvasSize.height}
  onClick={handleStageClick}
  onMouseMove={(e) => { handleMouseMove(e); handleMouseMovePan(e); }}
  onMouseDown={handleMouseDown}
  onMouseUp={handleMouseUp}
  onWheel={handleWheel}
  >
          <Layer>
            {lines.map((line, i) => (
              <React.Fragment key={i}>
                <Line
                  points={[line.p1.x, line.p1.y, line.p2.x, line.p2.y]}
                  stroke="black"
                  strokeWidth={.5}
                  onClick={() => handleLineClick(i)}
                />
                <Label
                x={(line.p1.x + line.p2.x) / 2}
                y={(line.p1.y + line.p2.y) / 2}
                offsetX={(line.dimension_mm?.toString().length || 1) * 3} // centra horizontalmente
                offsetY={6} // centra verticalmente
                >
                <Tag
                fill="white"        // Fondo blanco para simular corte de la línea
                pointerDirection="none"
                cornerRadius={2}    // Bordes redondeados
                stroke="white"      // Borde negro opcional
                strokeWidth={0.5}
  />
  <Text
    text={`${line.dimension_mm ?? ''}`}
    fontSize={7}
    fill="black"
    padding={1}         // Espacio entre texto y fondo
    align="center"
  />
</Label>
                {line.obj1 !== 'SPL' && line.nombre_obj1 && (
                  <Text x={line.p1.x + 5} y={line.p1.y - 15} text={line.nombre_obj1} fontSize={7} fill="black" />
                )}
                {line.obj2 !== 'SPL' && line.nombre_obj2 && (
                  <Text x={line.p2.x + 5} y={line.p2.y - 15} text={line.nombre_obj2} fontSize={7} fill="black" />
                )}
                {renderObjeto(line.obj1, line.p1.x, line.p1.y, `obj1-${i}`, i, 'p1', line)}
                {renderObjeto(line.obj2, line.p2.x, line.p2.y, `obj2-${i}`, i, 'p2', line)}
              </React.Fragment>
            ))}

            {points.length === 1 && mousePos && !eraserMode && (
              <Line
                points={[points[0].x, points[0].y, mousePos.x, mousePos.y]}
                stroke="gray"
                dash={[4, 4]}
                strokeWidth={1}
              />
            )}
            
            {/* ✅ Renderiza la vista previa del SPL */}
            {tempSPL && (
              <Group>
                <Line
                  points={[tempSPL.original.p1.x, tempSPL.original.p1.y, tempSPL.proj.x, tempSPL.proj.y]}
                  stroke="red"
                  strokeWidth={1}
                  dash={[2, 2]}
                />
                <Label
                  x={(tempSPL.original.p1.x + tempSPL.proj.x) / 2}
                  y={(tempSPL.original.p1.y + tempSPL.proj.y) / 2}
                >
                  <Tag
                    fill="white"
                    pointerDirection="none"
                    cornerRadius={2}
                  />
                  <Text
                    text={`${tempSPL.dim1}mm`}
                    fontSize={10}
                    fill="red"
                    padding={1}
                  />
                </Label>
                <Line
                  points={[tempSPL.proj.x, tempSPL.proj.y, tempSPL.original.p2.x, tempSPL.original.p2.y]}
                  stroke="red"
                  strokeWidth={1}
                  dash={[2, 2]}
                />
                <Label
                  x={(tempSPL.proj.x + tempSPL.original.p2.x) / 2}
                  y={(tempSPL.proj.y + tempSPL.original.p2.y) / 2}
                >
                  <Tag
                    fill="white"
                    pointerDirection="none"
                    cornerRadius={2}
                  />
                  <Text
                    text={`${tempSPL.dim2}mm`}
                    fontSize={10}
                    fill="red"
                    padding={1}
                  />
                </Label>
              </Group>
            )}

          </Layer>
        </Stage>
                  </div>
        
        {/* ✅ Renderiza el menú flotante aquí */}
        {renderFloatingMenu()}
        {renderTablaMenu()}

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
          {selectorPos && selectorEnd && !pencilMode && modoModificarExtremos && (
  <div style={{
    position: 'absolute',
    left: selectorPos.x,
    top: selectorPos.y,
    backgroundColor: 'white',
    border: '1px solid gray',
    padding: '5px',
    borderRadius: '5px',
    zIndex: 20
  }}>
    <p style={{ marginBottom: '5px' }}>Cambiar tipo:</p>
    {['Conector', 'BRK', 'SPL'].map(tipo => (
      <button
        key={tipo}
        onClick={() => {
          const updated = [...lines];
          const line = updated[selectorEnd.lineIndex];
          if (selectorEnd.end === 'p1') {
            line.obj1 = tipo;
          } else {
            line.obj2 = tipo;
          }
          handleStateChange(updated);
          setSelectorPos(null);
          setSelectorEnd(null);
        }}
        style={{
          marginRight: '5px',
          padding: '5px',
          border: '1px solid gray',
          borderRadius: '5px',
          backgroundColor: '#f0f0f0',
          cursor: 'pointer'
        }}
      >
        {tipo}
      </button>
    ))}
  </div>
)}

      </div>
    </div>
  );
}

export default App;
