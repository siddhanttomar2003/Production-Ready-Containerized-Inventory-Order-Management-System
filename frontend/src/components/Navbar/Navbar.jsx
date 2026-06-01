export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-center">
        <a href="/" className="logo-link" onClick={(e) => e.preventDefault()}>
          <span className="logo-ware">Logi</span>
          <span className="logo-view">Track</span>
        </a>
      </div>
    </nav>
  )
}
