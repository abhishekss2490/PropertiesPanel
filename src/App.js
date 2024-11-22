import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { TransformControls, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import './PropertiesPanel.css';

// DraggableInput component using mouse events
const DraggableInput = ({
  label,
  value,
  onChange,
  precision = 2,
  sensitivity = 0.01,
  isLocked,
  onLockChange,
  increment,
  onIncrementChange,
  type = 'position',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const dragRef = useRef({
    startX: 0,
    lastX: 0,
    accumulator: 0,
    currentValue: 0,
    lastEvent: null,
  });

  // RAF for smooth animation
  const rafRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // Cleanup function to ensure all events and RAFs are properly removed
  const cleanup = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    setIsDragging(false);
  }, []);

  // Ensure cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Reset state when type changes
  useEffect(() => {
    cleanup();
    dragRef.current = {
      startX: 0,
      lastX: 0,
      accumulator: 0,
      currentValue: value,
      lastEvent: null,
    };
  }, [type, cleanup]);

  // Keep dragRef value in sync with prop
  useEffect(() => {
    dragRef.current.currentValue = value;
  }, [value]);

  const updateValue = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastUpdateRef.current;

    // Maintain 60fps cap
    if (deltaTime < 16) {
      rafRef.current = requestAnimationFrame(updateValue);
      return;
    }

    const currentX = dragRef.current.lastEvent?.clientX ?? dragRef.current.lastX;
    const deltaX = currentX - dragRef.current.lastX;
    dragRef.current.lastX = currentX;
    dragRef.current.accumulator += deltaX;

    const delta =
      dragRef.current.accumulator *
      sensitivity *
      (dragRef.current.lastEvent?.shiftKey ? 0.1 : 1);

    let newValue = dragRef.current.currentValue + delta;

    // Handle type-specific constraints
    if (type === 'scale') {
      newValue = Math.max(0.0001, newValue); // Prevent negative or zero scale
    } else if (type === 'rotation') {
      // Normalize rotation to -180 to 180 range
      newValue = ((newValue + 180) % 360) - 180;
    }

    // Apply increment locking
    if (isLocked) {
      newValue = Math.round(newValue / increment) * increment;
    }

    // Apply precision and update
    newValue = parseFloat(newValue.toFixed(precision));
    onChange(newValue);

    dragRef.current.currentValue = newValue;
    dragRef.current.accumulator = 0;
    lastUpdateRef.current = now;

    if (isDragging) {
      rafRef.current = requestAnimationFrame(updateValue);
    }
  }, [isDragging, sensitivity, isLocked, increment, precision, onChange, type]);

  const handleMouseMove = useCallback(
    (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current.lastEvent = e;
      }
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(
    (e) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      }
    },
    [isDragging, handleMouseMove]
  );

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      e.preventDefault();
      e.stopPropagation();

      cleanup();

      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        lastX: e.clientX,
        accumulator: 0,
        currentValue: parseFloat(value) || 0,
        lastEvent: e,
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      if (inputRef.current) {
        inputRef.current.focus();
        setIsFocused(true);
      }

      lastUpdateRef.current = performance.now();
      rafRef.current = requestAnimationFrame(updateValue);
    }
  };

  const handleInputChange = (e) => {
    let newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      // Handle type-specific constraints
      if (type === 'scale') {
        newValue = Math.max(0.0001, newValue); // Prevent negative or zero scale
      } else if (type === 'rotation') {
        newValue = ((newValue + 180) % 360) - 180;
      }

      // Apply increment locking
      if (isLocked) {
        newValue = Math.round(newValue / increment) * increment;
      }

      // Apply precision
      newValue = parseFloat(newValue.toFixed(precision));

      onChange(newValue);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    cleanup();
  };

  const handleBlur = () => {
    setIsFocused(false);
    cleanup();
  };

  // Handle keyboard navigation with fine control
  const handleKeyDown = (e) => {
    let delta = 0;
    const baseStep = isLocked ? increment : sensitivity;

    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowRight':
        delta = baseStep;
        break;
      case 'ArrowDown':
      case 'ArrowLeft':
        delta = -baseStep;
        break;
      case 'PageUp':
        delta = baseStep * 10;
        break;
      case 'PageDown':
        delta = -baseStep * 10;
        break;
      case 'Home':
        // Reset to default values based on type
        const defaults = { position: 0, rotation: 0, scale: 1 };
        onChange(defaults[type] || 0);
        e.preventDefault();
        return;
      default:
        return;
    }

    if (e.shiftKey) delta *= 0.1;
    if (e.ctrlKey) delta *= 10;

    let newValue = (parseFloat(value) || 0) + delta;

    // Apply type-specific constraints
    if (type === 'scale') {
      newValue = Math.max(0.0001, newValue);
    } else if (type === 'rotation') {
      newValue = ((newValue + 180) % 360) - 180;
    }

    // Apply increment locking
    if (isLocked) {
      newValue = Math.round(newValue / increment) * increment;
    }

    // Apply precision
    newValue = parseFloat(newValue.toFixed(precision));

    onChange(newValue);
    e.preventDefault();
  };

  return (
    <div className="draggable-input-group">
      <label>{label}</label>
      <div className="input-wrapper">
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={handleInputChange}
          onMouseDown={handleMouseDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`
            ${isDragging ? 'dragging' : ''}
            ${isFocused ? 'focused' : ''}
            input-${type}
          `}
          step={isLocked ? increment : 'any'}
          min={type === 'scale' ? 0.0001 : undefined}
        />
      </div>
      <input
        type="checkbox"
        checked={isLocked}
        onChange={onLockChange}
        className="lock-checkbox"
        title="Lock to increment"
      />
      {isLocked && (
        <input
          type="number"
          value={increment}
          onChange={(e) => onIncrementChange(parseFloat(e.target.value) || 1)}
          placeholder="Increment"
          className="increment-input"
        />
      )}
    </div>
  );
};

const PropertiesPanel = ({ transform, setTransform, setMode, mode }) => {
  const [isPanelDragging, setIsPanelDragging] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const panelRef = useRef();
  const dragStartRef = useRef({ x: 0, y: 0 });

  const [lockedIncrements, setLockedIncrements] = useState({
    position: { x: false, y: false, z: false },
    rotation: { x: false, y: false, z: false },
    scale: { x: false, y: false, z: false },
  });

  const [increments, setIncrements] = useState({
    position: { x: 1, y: 1, z: 1 },
    rotation: { x: 1, y: 1, z: 1 },
    scale: { x: 0.1, y: 0.1, z: 0.1 },
  });

  const handlePanelMouseDown = (e) => {
    if (e.target === panelRef.current || e.target.tagName === 'H2') {
      setIsPanelDragging(true);
      dragStartRef.current = {
        x: e.clientX - panelPosition.x,
        y: e.clientY - panelPosition.y,
      };
    }
  };

  const handlePanelMouseMove = useCallback(
    (e) => {
      if (isPanelDragging) {
        setPanelPosition({
          x: e.clientX - dragStartRef.current.x,
          y: e.clientY - dragStartRef.current.y,
        });
      }
    },
    [isPanelDragging]
  );

  const handlePanelMouseUp = () => {
    setIsPanelDragging(false);
  };

  useEffect(() => {
    if (isPanelDragging) {
      window.addEventListener('mousemove', handlePanelMouseMove);
      window.addEventListener('mouseup', handlePanelMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePanelMouseMove);
      window.removeEventListener('mouseup', handlePanelMouseUp);
    };
  }, [isPanelDragging, handlePanelMouseMove]);

  const updateTransform = (type, axis, value) => {
    setTransform((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [axis]: value,
      },
    }));
  };

  return (
    <div
      ref={panelRef}
      className="properties-panel"
      style={{
        position: 'absolute',
        top: panelPosition.y,
        left: panelPosition.x,
        cursor: isPanelDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handlePanelMouseDown}
    >
      <h2>Properties</h2>

      {/* Position Inputs */}
      <div className="property-group">
        <h3>Position</h3>
        {['x', 'y', 'z'].map((axis) => (
          <DraggableInput
            key={`pos-${axis}`}
            label={axis.toUpperCase()}
            value={transform.position[axis]}
            onChange={(value) => updateTransform('position', axis, value)}
            precision={3}
            sensitivity={0.005}
            type="position"
            isLocked={lockedIncrements.position[axis]}
            onLockChange={() => {
              setLockedIncrements((prev) => ({
                ...prev,
                position: {
                  ...prev.position,
                  [axis]: !prev.position[axis],
                },
              }));
            }}
            increment={increments.position[axis]}
            onIncrementChange={(value) => {
              setIncrements((prev) => ({
                ...prev,
                position: { ...prev.position, [axis]: value },
              }));
            }}
          />
        ))}
      </div>

      {/* Rotation Inputs */}
      <div className="property-group">
        <h3>Rotation</h3>
        {['x', 'y', 'z'].map((axis) => (
          <DraggableInput
            key={`rot-${axis}`}
            label={axis.toUpperCase()}
            value={transform.rotation[axis]}
            onChange={(value) => updateTransform('rotation', axis, value)}
            precision={1}
            sensitivity={0.2}
            type="rotation"
            isLocked={lockedIncrements.rotation[axis]}
            onLockChange={() => {
              setLockedIncrements((prev) => ({
                ...prev,
                rotation: {
                  ...prev.rotation,
                  [axis]: !prev.rotation[axis],
                },
              }));
            }}
            increment={increments.rotation[axis]}
            onIncrementChange={(value) => {
              setIncrements((prev) => ({
                ...prev,
                rotation: { ...prev.rotation, [axis]: value },
              }));
            }}
          />
        ))}
      </div>

      {/* Scale Inputs */}
      <div className="property-group">
        <h3>Scale</h3>
        {['x', 'y', 'z'].map((axis) => (
          <DraggableInput
            key={`scale-${axis}`}
            label={axis.toUpperCase()}
            value={transform.scale[axis]}
            onChange={(value) => updateTransform('scale', axis, value)}
            precision={3} // Increased precision for finer control
            sensitivity={0.005} // Increased sensitivity for responsiveness
            type="scale"
            isLocked={lockedIncrements.scale[axis]}
            onLockChange={() => {
              setLockedIncrements((prev) => ({
                ...prev,
                scale: { ...prev.scale, [axis]: !prev.scale[axis] },
              }));
            }}
            increment={increments.scale[axis]}
            onIncrementChange={(value) => {
              setIncrements((prev) => ({
                ...prev,
                scale: { ...prev.scale, [axis]: value },
              }));
            }}
          />
        ))}
      </div>

      {/* Transform Mode Buttons */}
      <div className="property-group">
        <h3>Transform Mode</h3>
        <div className="button-group">
          <button
            onClick={() => setMode('translate')}
            className={mode === 'translate' ? 'active' : ''}
          >
            Translate
          </button>
          <button
            onClick={() => setMode('rotate')}
            className={mode === 'rotate' ? 'active' : ''}
          >
            Rotate
          </button>
          <button
            onClick={() => setMode('scale')}
            className={mode === 'scale' ? 'active' : ''}
          >
            Scale
          </button>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const meshRef = useRef();
  const transformControlRef = useRef();
  const [controlsEnabled, setControlsEnabled] = useState(true);
  const [mode, setMode] = useState('translate');
  const [transform, setTransform] = useState({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  });

  useEffect(() => {
    if (transformControlRef.current) {
      transformControlRef.current.setMode(mode);
      transformControlRef.current.addEventListener('change', () => {
        if (meshRef.current) {
          const { position, rotation, scale } = meshRef.current;
          setTransform({
            position: {
              x: position.x,
              y: position.y,
              z: position.z,
            },
            rotation: {
              x: THREE.MathUtils.radToDeg(rotation.x),
              y: THREE.MathUtils.radToDeg(rotation.y),
              z: THREE.MathUtils.radToDeg(rotation.z),
            },
            scale: {
              x: scale.x,
              y: scale.y,
              z: scale.z,
            },
          });
        }
      });
    }
  }, [mode]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z
      );
      meshRef.current.rotation.set(
        THREE.MathUtils.degToRad(transform.rotation.x),
        THREE.MathUtils.degToRad(transform.rotation.y),
        THREE.MathUtils.degToRad(transform.rotation.z)
      );
      meshRef.current.scale.set(
        transform.scale.x,
        transform.scale.y,
        transform.scale.z
      );
    }
  }, [transform]);

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Canvas className="canvas" camera={{ position: [0, 5, 10], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={1.5} />

          <TransformControls
            ref={transformControlRef}
            object={meshRef.current}
            mode={mode}
            onMouseDown={() => setControlsEnabled(false)}
            onMouseUp={() => setControlsEnabled(true)}
          />

          <mesh ref={meshRef}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="orange" />
          </mesh>

          {controlsEnabled && <OrbitControls />}

          <gridHelper args={[20, 20]} />
          <axesHelper args={[5]} />
        </Canvas>
      </div>

      <PropertiesPanel
        transform={transform}
        setTransform={setTransform}
        setMode={setMode}
        mode={mode}
      />
    </div>
  );
};

export { App };
