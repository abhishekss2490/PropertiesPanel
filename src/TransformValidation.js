// TransformValidation.js
export const validateTransformValue = (value, type, axis) => {
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // If it's not a valid number, return defaults
  if (isNaN(numValue)) {
    return type === 'scale' ? 1 : 0;
  }

  // Handle each transform type
  switch (type) {
    case 'scale':
      // Scale must be positive
      return Math.max(0.0001, Math.abs(numValue));
      
    case 'rotation':
      // Allow negative rotation but keep within -180 to 180
      // return ((numValue + 180) % 360) - 180;
      return numValue;
      
    case 'position':
      // Allow full negative range for position
      return numValue;
      
    default:
      return numValue;
  }
};