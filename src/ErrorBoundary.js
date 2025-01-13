/**
 * Error Boundary Component for Transform Controls
 * This component catches errors that occur in its child components during rendering,
 * in lifecycle methods, and in constructors of the whole tree below it.
 */
import React from 'react';

class TransformErrorBoundary extends React.Component {
  /**
   * Initialize the error boundary
   * @param {Object} props - Component props
   */
  constructor(props) {
    super(props);
    // Initial state to track error status
    this.state = { 
      hasError: false,  // Flag to indicate if an error occurred
      error: null       // Store the error object
    };
  }

  /**
   * Static method called when an error occurs
   * This is called during the "render" phase, so side-effects are not permitted
   * @param {Error} error - The error that was thrown
   * @returns {Object} New state to update the component
   */
  static getDerivedStateFromError(error) {
    // Update state to indicate an error has occurred
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called after an error is caught
   * This is called during the "commit" phase, so side-effects are permitted
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - Component stack trace information
   */
  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Transform Error:', error, errorInfo);
    // Here you could also send error reports to an error tracking service
  }

  /**
   * Render method determines what to display
   * Either shows error UI or renders children normally
   */
  render() {
    if (this.state.hasError) {
      // Render fallback UI when an error occurs
      return (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)', // Center the error message
          padding: '20px',
          background: 'rgba(0,0,0,0.8)',     // Semi-transparent background
          color: 'white',
          borderRadius: '8px'
        }}>
          <h3>Something went wrong with the transform controls</h3>
          <button 
            onClick={() => this.setState({ hasError: false })} // Reset error state
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default TransformErrorBoundary;