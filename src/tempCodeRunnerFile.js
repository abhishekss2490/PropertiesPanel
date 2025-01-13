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