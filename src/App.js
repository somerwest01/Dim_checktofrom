import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './App.css';
import { useEffect } from 'react';

import { Stage, Layer, Line, Text, Rect, Circle, RegularPolygon, Label, Tag } from 'react-konva';

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
  const [mostrarExtremos, setMostrarExtremos] = useState(false);
  const [mostrarExcel, setMostrarExcel] = useState(false);
  const [procesandoExcel, setProcesandoExcel] = useState(false);
  const [totalCircuitos, setTotalCircuitos] = useState(0);
  const [circuitosProcesados, setCircuitosProcesados] = useState(0);
  const [modoAnguloRecto, setModoAnguloRecto] = useState(false);
  const [selectorPos, setSelectorPos] = useState(null); // posición del panel flotante
  const [selectorEnd, setSelectorEnd] = useState(null); // info del extremo seleccionad
  const [isPanning, setIsPanning] = useState(false);
  const [lastPos, setLastPos] = useState(null);
  const [addingSPL, setAddingSPL] = useState(false);
  const [editingSPLMode, setEditingSPLMode] = useState(false);



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

  
 const handleImportDXF = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parser = new window.DxfParser();
      const dxf = parser.parseSync(new TextDecoder().decode(e.target.result));
      const nuevasLineas = [];

      dxf.entities.forEach((ent) => {
        if (
          ent.type === 'LINE' &&
          ent.start?.x !== undefined &&
          ent.start?.y !== undefined &&
          ent.end?.x !== undefined &&
          ent.end?.y !== undefined
        ) {
          nuevasLineas.push({
            p1: { x: ent.start.x, y: ent.start.y },
            p2: { x: ent.end.x, y: ent.end.y },
            obj1: 'Ninguno',
            obj2: 'Ninguno',
            nombre_obj1: '',
            nombre_obj2: '',
            dimension_mm: null,
            deduce1: '',
            deduce2: '',
            item: null
          });
        }
      });

      if (nuevasLineas.length === 0) {
        setStatusMessage('⚠️ No se encontraron líneas válidas en el archivo DXF.');
      } else {
        setLines([...lines, ...nuevasLineas]);
        setStatusMessage('✅ Plano base importado desde DXF.');
      }
    } catch (error) {
      console.error('Error al procesar DXF:', error);
      setStatusMessage('❌ Error al importar archivo DXF.');
    }
  };

  reader.readAsArrayBuffer(file);
};



  const [hoverBoton, setHoverBoton] = useState(null);
  const [modoModificarExtremos, setModoModificarExtremos] = useState(false);


  const proximityThreshold = 35;

  const getClosestEndpoint = (pos) => {
    let closest = null;
    let minDist = Infinity;

    lines.forEach((line) => {
      ['p1', 'p2'].forEach((end) => {
        const point = line[end];
        const dist = Math.hypot(pos.x - point.x, pos.y - point.y);
        if (dist < proximityThreshold && dist < minDist) {
          closest = { point, obj: line[end === 'p1' ? 'obj1' : 'obj2'] };
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

    // --- Si estamos en modo "Agregar SPL" -> encontrar segmento y dividirlo ---
    if (addingSPL) {
      const found = findClosestSegment(pos);
      const proximityPx = 12; // Ajuste: distancia máxima para "aceptar" el drop
      if (!found || found.distance > proximityPx) {
        setStatusMessage('Acércate a una línea y haz clic para colocar el SPL.');
        return;
      }

      const { lineIndex, proj } = found;
      const original = lines[lineIndex];

      const totalDim = parseFloat(original.dimension_mm) || Math.hypot(original.p2.x - original.p1.x, original.p2.y - original.p1.y);
      const dim1 = Math.round(totalDim * proj.t);
      const dim2 = Math.round(totalDim * (1 - proj.t));

      // Asignar el nombre "SPL" por defecto
      const newSPLName = 'SPL';

      // crear las dos nuevas líneas que reemplazarán a la original
      const lineA = {
        p1: { ...original.p1 },
        p2: { x: proj.x, y: proj.y },
        obj1: original.obj1,
        obj2: 'SPL',
        nombre_obj1: original.nombre_obj1 || '',
        nombre_obj2: newSPLName,
        dimension_mm: dim1,
        deduce1: original.deduce1 || '',
        deduce2: '',
        item: original.item || null
      };

      const lineB = {
        p1: { x: proj.x, y: proj.y },
        p2: { ...original.p2 },
        obj1: 'SPL',
        obj2: original.obj2,
        nombre_obj1: newSPLName,
        nombre_obj2: original.nombre_obj2 || '',
        dimension_mm: dim2,
        deduce1: '',
        deduce2: original.deduce2 || '',
        item: original.item || null
      };

      const updated = [...lines];
      updated.splice(lineIndex, 1, lineA, lineB);
      setLines(updated);
      setAddingSPL(false);
      setStatusMessage('🔺 SPL insertado correctamente.');
      return;
    }

    // --- Si no estamos en modo agregar SPL, ejecutar la lógica de lápiz existente ---
    if (pencilMode) {
      if (eraserMode) return;

      if (points.length === 0) {
        const snap = getClosestEndpoint(pos);
        if (snap) {
          setPoints([snap.point]);
        } else {
          setPoints([pos]);
        }
      } else {
        let adjustedPos = { ...pos };
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

        const newLine = {
          p1: points[0],
          p2: adjustedPos,
          obj1,
          obj2,
          nombre_obj1: '',
          nombre_obj2: '',
          dimension_mm: null,
          deduce1: '',
          deduce2: '',
          item: null
        };

        setTempLine(newLine);
        setInputPos(pos);
        setShowInput(true);
        setPoints([]);
        setMousePos(null);
      }
    }
  };

const handleMouseMove = (e) => {
  if (pencilMode && points.length === 1 && !eraserMode) {
    const stage = e.target.getStage();
    const pos = getRelativePointerPosition(stage);
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
  }
};


  const confirmDimension = () => {
    if (tempLine) {
      tempLine.dimension_mm = parseFloat(dimension);
      setLines([...lines, tempLine]);
      setTempLine(null);
      setDimension('');
      setShowInput(false);
    }
  };


const updateNombre = () => {
    if (selectedEnd) {
      const updatedLines = [...lines];
      const targetLine = updatedLines[selectedEnd.lineIndex];
      const newName = nameInput;
      const targetPos = targetLine[selectedEnd.end];

      // Asignar nombre al extremo seleccionado
      if (selectedEnd.end === 'p1') {
        targetLine.nombre_obj1 = newName;
      } else {
        targetLine.nombre_obj2 = newName;
      }

      // Propagar nombre a extremos cercanos
      updatedLines.forEach((line) => {
        // Usa una tolerancia para evitar problemas de precisión flotante
        const tol = 1; 
        if (Math.hypot(line.p1.x - targetPos.x, line.p1.y - targetPos.y) < tol) {
          line.nombre_obj1 = newName;
        }
        if (Math.hypot(line.p2.x - targetPos.x, line.p2.y - targetPos.y) < tol) {
          line.nombre_obj2 = newName;
        }
      });

      setLines(updatedLines);
      setSelectedEnd(null);
      setNameInput('');
    }
  };



  const handleLineClick = (index) => {
    if (eraserMode) {
      const updatedLines = [...lines];
      updatedLines.splice(index, 1);
      setLines(updatedLines);
    }
  };
const calcularRuta = (start, end) => {
  const graph = {};
  lines.forEach((line) => {
    const { nombre_obj1, nombre_obj2, dimension_mm } = line;
    if (!nombre_obj1 || !nombre_obj2 || !dimension_mm) return;
    if (!graph[nombre_obj1]) graph[nombre_obj1] = {};
    if (!graph[nombre_obj2]) graph[nombre_obj2] = {};
    graph[nombre_obj1][nombre_obj2] = dimension_mm;
    graph[nombre_obj2][nombre_obj1] = dimension_mm;
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
    if (!nombre_obj1 || !nombre_obj2 || !dimension_mm) return;

    if (!graph[nombre_obj1]) graph[nombre_obj1] = {};
    if (!graph[nombre_obj2]) graph[nombre_obj2] = {};

    graph[nombre_obj1][nombre_obj2] = dimension_mm;
    graph[nombre_obj2][nombre_obj1] = dimension_mm;
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
  setLines([]);
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
               setLines(contenido);
               setStatusMessage('✅ Archivo cargado correctamente.');
           } catch (error) {
               setStatusMessage('❌ Error al cargar el archivo.');
           }
       };
       reader.readAsText(file);
   };

const handleImportExcel = (e) => {
  setStatusMessage('Importando archivo...');
  setProcesandoExcel(true); // ⏳ Mostrar spinner

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    const data = new Uint8Array(evt.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    const updatedSheet = [...jsonData];

    setTotalCircuitos(updatedSheet.length - 2); // Asumiendo que las filas empiezan en la fila 2
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
      if (!nombre_obj1 || !nombre_obj2 || !dimension_mm) return;
      if (!graph[nombre_obj1]) graph[nombre_obj1] = {};
      if (!graph[nombre_obj2]) graph[nombre_obj2] = {};
      graph[nombre_obj1][nombre_obj2] = dimension_mm;
      graph[nombre_obj2][nombre_obj1] = dimension_mm;
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

      let deduceTotal = 0;
      const extremosProcesados = new Set();
      lines.forEach((line) => {
        const extremos = [
          { nombre: line.nombre_obj1, valor: parseFloat(line.deduce1) },
          { nombre: line.nombre_obj2, valor: parseFloat(line.deduce2) }
        ];
        extremos.forEach(({ nombre, valor }) => {
          if ((nombre === from_item || nombre === to_item) && !extremosProcesados.has(nombre)) {
            extremosProcesados.add(nombre);
            if (!isNaN(valor)) deduceTotal += valor;
          }
        });
      });

      updatedSheet[i][22] = distancia.toFixed(2);
      updatedSheet[i][23] = 'Sí';
    } catch (error) {
      updatedSheet[i][22] = 'Error en fila';
      updatedSheet[i][23] = 'No';
      console.error(`Error en fila ${i}:`, error);
    }
  }

  // ✅ Actualiza el contador una sola vez por bloque
  setCircuitosProcesados(i - 2);

  if (i < updatedSheet.length) {
    setTimeout(processChunk, 0);
  } else {
        // ✅ Finaliza y descarga
        const newWorksheet = XLSX.utils.aoa_to_sheet(updatedSheet);
        const newWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
        const excelBuffer = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(blob, 'archivo_con_dimensiones_y_validacion.xlsx');
        setStatusMessage('✅ Archivo procesado y listo para descargar.');
        setArchivoProcesado(true);
        setProcesandoExcel(false); // ✅ Ocultar spinner
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
      dimension_mm: (parseFloat(line.dimension_mm || 0) + parseFloat(line.deduce || 0)).toFixed(2),
      deduce: line.deduce,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Líneas');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'resultado_procesado.xlsx');

    setStatusMessage('✅ Archivo listo para descargar.');
    setArchivoProcesado(true);
    setMostrarExcel(false);      // Oculta el panel de Excel
    setArchivoProcesado(false);  // Limpia el estado del archivo procesado
    setStatusMessage('');        // Borra el mensaje de estado

  };

const renderObjeto = (tipo, x, y, key, index, end) => {
    const isHovered = hoveredObj === key;
    const commonProps = {
      key,
      x,
      y,
      onMouseEnter: () => setHoveredObj(key),
      onMouseLeave: () => setHoveredObj(null),
      onClick: () => {
        if (!eraserMode && !pencilMode) {
          setSelectedEnd({ lineIndex: index, end });
          setNameInput(end === 'p1' ? lines[index].nombre_obj1 : lines[index].nombre_obj2);
          setSelectorPos({ x, y });
          setSelectorEnd({ lineIndex: index, end });
        }
      },
    };

    switch (tipo) {
      case 'Conector':
        return <Rect {...commonProps} x={x - 5} y={y - 5} width={10} height={10} fill={isHovered ? 'green' : 'purple'} />;
      case 'BRK':
        return <Circle {...commonProps} radius={4} fill={isHovered ? 'green' : 'black'} />;
      case 'SPL':
        const name = end === 'p1' ? lines[index].nombre_obj1 : lines[index].nombre_obj2;
        const fixedRadius = 7;
        const circleDiameter = fixedRadius * 2;
        
        const calculatedFontSize = Math.min(8, (circleDiameter / name.length) * 1.3);

        return (
          <React.Fragment key={key}>
            {/* El círculo ahora tiene un radio fijo */}
            <Circle {...commonProps} radius={fixedRadius} fill="white" stroke="red" strokeWidth={1.5} />
            
            {/* Se añade commonProps para que el texto sea también clickeable */}
            <Text
              {...commonProps} 
              x={x}
              y={y}
              text={name}
              fontSize={calculatedFontSize}
              fill="black"
              align="center"
              verticalAlign="middle"
              width={circleDiameter}
              height={circleDiameter}
              offsetX={circleDiameter / 2}
              offsetY={circleDiameter / 2}
            />
          </React.Fragment>
        );
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
  onMouseEnter={() => setHoverBoton('diseño')}
  onMouseLeave={() => setHoverBoton(null)}
  onClick={() => setMostrarExtremos(!mostrarExtremos)}
  style={{
    ...botonBase,
    ...(hoverBoton === 'diseño' ? botonExpandido : {})
  }}
>
  ✏️ {hoverBoton === 'diseño' && 'Diseño'}
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
 
  <input
  type="file"
  accept=".dxf"
  id="importarDXF"
  onChange={handleImportDXF}
  style={{ display: 'none' }}
/>
<button
  onClick={() => document.getElementById('importarDXF').click()}
  style={{
    ...botonBase,
    ...{ width: '150px', marginTop: '5px' }
  }}
>
  📐 Importar DXF
</button>

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
  📂 {hoverBoton === 'abrir' && 'Abrir'}
</button>
  </div>
<hr style={{ borderTop: '1px solid lightgray', margin: '10px 0' }} />



        {true && (
          <>

{mostrarExtremos && (
  <>
    <h4 style= {{textAlign: 'center' }}>Seleccione los extremos</h4>
    <label style= {{fontSize: '12px'}}>Tipo de extremo 1:  </label>
    <select value={obj1} onChange={(e) => setObj1(e.target.value)}>
      <option>Ninguno</option>
      <option>Conector</option>
      <option>BRK</option>
      <option>SPL</option>
    </select>
    <br /><br />
    <label style= {{fontSize: '12px'}}>Tipo de extremo 2:  </label>
    <select value={obj2} onChange={(e) => setObj2(e.target.value)}>
      <option>Ninguno</option>
      <option>Conector</option>
      <option>BRK</option>
      <option>SPL</option>
    </select>
    <br /><br />
    <button
      onClick={() => setEraserMode(!eraserMode)}
      style={{ backgroundColor: eraserMode ? 'lightcoral' : 'white' }}
    >
      🧽 {eraserMode ? 'Desactivar borrador' : 'Activar borrador'}
    </button>
    <br /><br />
    <hr style={{ borderTop: '1px solid lightgray', margin: '10px 0' }} />
  </>
)}

              
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


              {selectedEnd && (
          <>
            <h4>Editar nombre del objeto</h4>
            <label>Nombre:</label>
            <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)} />
            <button onClick={updateNombre}>Asignar</button>

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
        <th style={{ backgroundColor: '#3f51b5', color: 'white', border: '1px solid black', padding: '6px' }}>#</th>
        <th style={{ backgroundColor: '#3f51b5', color: 'white', border: '1px solid black', padding: '6px' }}>Lado 1</th>
        <th style={{ backgroundColor: '#3f51b5', color: 'white', border: '1px solid black', padding: '6px' }}>D1</th>
        <th style={{ backgroundColor: '#3f51b5', color: 'white', border: '1px solid black', padding: '6px' }}>Lado 2</th>
        <th style={{ backgroundColor: '#3f51b5', color: 'white', border: '1px solid black', padding: '6px' }}>D2</th>
        <th style={{ backgroundColor: '#3f51b5', color: 'white', border: '1px solid black', padding: '6px' }}>Dim (mm)</th>
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
    <p style={{ fontStyle: 'italic', color: 'blue' }}>{statusMessage}</p>

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

      <div style={{ position: 'relative' }}>
          
<div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
  <button
    onClick={() => setModoAnguloRecto(!modoAnguloRecto)}
    style={{
      backgroundColor: modoAnguloRecto ? 'lightblue' : 'white',
      border: '1px solid gray',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    {modoAnguloRecto ? '🔒 Ángulo recto activado' : '🔓 Ángulo libre'}
  </button>

  <button
    onClick={() => setPencilMode(!pencilMode)}
    style={{
      backgroundColor: pencilMode ? 'lightgreen' : 'white',
      border: '1px solid gray',
      padding: '5px 10px',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    ✏️ {pencilMode ? 'Desactivar lápiz' : 'Activar lápiz'}
  </button>

  <button
    onClick={() => setEraserMode(!eraserMode)}
    style={{
      backgroundColor: eraserMode ? 'lightcoral' : 'white',
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
    backgroundColor: modoModificarExtremos ? 'khaki' : 'white',
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
    backgroundColor: addingSPL ? 'lightgreen' : 'white',
    border: '1px solid gray',
    padding: '5px 10px',
    borderRadius: '5px',
    cursor: 'pointer'
  }}
>
  🔺 {addingSPL ? 'SPL: ON' : 'Agregar SPL'}
</button>
        <button
          onClick={() => {
            setEditingSPLMode(true);
            setAddingSPL(false); // Desactiva el modo de agregar SPL
            setStatusMessage('Arrastra un SPL sobre la línea para moverlo.');
          }}
          style={{ backgroundColor: editingSPLMode ? '#a0a0a0' : '#f0f0f0' }}
        >
          Editar SPL
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
              strokeWidth={2}
              onClick={() => handleLineClick(i)}
            />
            <Label
              x={(line.p1.x + line.p2.x) / 2}
              y={(line.p1.y + line.p2.y) / 2}
              offsetX={(line.dimension_mm?.toString().length || 1) * 3}
              offsetY={6}
            >
              <Tag
                fill="white"
                pointerDirection="none"
                cornerRadius={2}
                stroke="white"
                strokeWidth={0.5}
              />
              <Text
                text={`${line.dimension_mm ?? ''}`}
                fontSize={11}
                fill="black"
                padding={1}
                align="center"
              />
            </Label>
            {renderObjeto(line.obj1, line.p1.x, line.p1.y, `obj1-${i}`, i, 'p1')}
            {renderObjeto(line.obj2, line.p2.x, line.p2.y, `obj2-${i}`, i, 'p2')}
          </React.Fragment>
        ))}
        {/* El código de la línea temporal debe estar aquí, fuera del .map */}
        {points.length === 1 && mousePos && !eraserMode && (
          <Line
            points={[points[0].x, points[0].y, mousePos.x, mousePos.y]}
            stroke="gray"
            dash={[4, 4]}
            strokeWidth={1}
          />
        )}
      </Layer>
    </Stage>
                  </div>

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
    <p style={{ marginBottom: '5px' }}>Cambiar tipo de extremo:</p>
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
          setLines(updated);
          setSelectorPos(null);
          setSelectorEnd(null);
        }}
        style={{
          marginRight: '5px',
          padding: '5px 10px',
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
