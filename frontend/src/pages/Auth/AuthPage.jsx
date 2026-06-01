import { useState } from 'react'
import { login, register } from '../../services/authService.js'

export default function AuthPage({ onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const resetForm = () => {
    setPassword('')
    setConfirmPassword('')
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp)
    resetForm()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!email.trim() || !password) {
      setErrorMessage('Please fill in all fields.')
      return
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.')
        return
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.')
        return
      }

      setLoading(true)
      try {
        const response = await register({ email, password })
        if (response.error) {
          setErrorMessage(response.error)
        } else {
          setSuccessMessage('Account created! Logging you in...')
          // Automatically log them in after registration
          const loginResponse = await login({ email, password })
          if (!loginResponse.error && loginResponse.token) {
            localStorage.setItem('token', loginResponse.token)
            localStorage.setItem('user', JSON.stringify(loginResponse.user))
            setTimeout(() => {
              onAuthSuccess(loginResponse.user)
            }, 1000)
          } else {
            setErrorMessage('Account created successfully, but auto-login failed. Please sign in.')
            setIsSignUp(false)
          }
        }
      } catch (err) {
        console.error('Registration failed:', err)
        setErrorMessage('Registration failed. Please try again.')
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(true)
      try {
        const response = await login({ email, password })
        if (response.code === 'USER_NOT_FOUND') {
          setErrorMessage("Account not found. Switching to Sign Up mode...")
          setTimeout(() => {
            setIsSignUp(true)
            resetForm()
          }, 1500)
        } else if (response.error) {
          setErrorMessage(response.error)
        } else if (response.token && response.user) {
          localStorage.setItem('token', response.token)
          localStorage.setItem('user', JSON.stringify(response.user))
          onAuthSuccess(response.user)
        } else {
          setErrorMessage('Invalid response from server.')
        }
      } catch (err) {
        console.error('Login failed:', err)
        setErrorMessage('Failed to connect to backend server.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-bg-blob blob-1"></div>
      <div className="auth-bg-blob blob-2"></div>

      <div className="auth-card">
        <div className="auth-header">
          <a href="/" className="logo-link auth-logo-text" onClick={(e) => e.preventDefault()}>
            <span className="logo-ware">Logi</span>
            <span className="logo-view">Track</span>
          </a>
          <h2 className="auth-title">{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
          <p className="auth-subtitle">
            {isSignUp
              ? 'Get started with LogiTrack inventory system.'
              : 'Sign in to access your inventory control dashboard.'}
          </p>
        </div>

        {errorMessage && (
          <div className="auth-toast-error">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-toast-error" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#34d399' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <label className="auth-label">Email Address</label>
            <input
              type="email"
              className="auth-input"
              placeholder="e.g. admin@logitrack.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Password</label>
            <input
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div className="auth-input-group">
              <label className="auth-label">Confirm Password</label>
              <input
                type="password"
                className="auth-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <span>{isSignUp ? 'Already have an account?' : 'Need an account?'}</span>
          <button className="auth-toggle-link" onClick={handleToggleMode}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  )
}
