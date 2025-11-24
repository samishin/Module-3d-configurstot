// ErrorBoundary.jsx
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('3D Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Что-то пошло не так</h2>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Попробовать снова
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary