import { Component } from 'react'

export default class RenderErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, message: '' }
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'The SpaceGuard view encountered an unexpected render error.',
    }
  }

  componentDidCatch(error, info) {
    console.error('SpaceGuard render error:', error, info)
  }

  reset = () => {
    this.setState({ hasError: false, message: '' })
  }

  render() {
    if (this.state.hasError) {
      const isViewport = this.props.variant === 'viewport'

      if (isViewport) {
        return (
          <div className="mission-render-fallback" role="status">
            <div>
              <span className="eyebrow">VISUALIZATION</span>
              <strong>3D viewport unavailable</strong>
              <p>The mission controls remain available while the orbital renderer recovers.</p>
              <button type="button" onClick={this.reset}>Retry viewport</button>
            </div>
          </div>
        )
      }

      return (
        <div className="mission-route-fallback" role="alert">
          <div>
            <span className="eyebrow">SPACEGUARD</span>
            <strong>View could not be rendered</strong>
            <p>{this.state.message}</p>
            <button type="button" onClick={this.reset}>Retry view</button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
