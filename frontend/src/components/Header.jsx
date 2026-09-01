import { Link, useLocation } from 'react-router-dom'

function Header() {
  const location = useLocation()

  const estaNaAreaRestrita = location.pathname.startsWith('/sistema')

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="brand">
          Sistema CIF
        </Link>

        {estaNaAreaRestrita ? (
          <nav className="main-nav">
            <Link to="/sistema">Início</Link>

            <Link to="/sistema/pacientes">
              Pacientes
            </Link>

            <div className="user-area">
              <div className="user-info">
                <strong>Usuário de teste</strong>
                <span>Instituição de teste</span>
              </div>

              <Link to="/" className="logout-link">
                Sair
              </Link>
            </div>
          </nav>
        ) : (
          <nav className="main-nav">
            <Link to="/">Início</Link>

            <Link to="/login" className="login-link">
              Entrar
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}

export default Header