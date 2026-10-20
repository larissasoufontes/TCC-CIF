import { Link, useLocation, useNavigate } from 'react-router-dom'

import { limparSessao, obterSessao, PERFIS } from '../auth'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const sessao = obterSessao()

  const estaNaAreaRestrita =
    sessao &&
    (location.pathname.startsWith('/sistema') ||
      location.pathname.startsWith('/pesquisa') ||
      location.pathname.startsWith('/admin'))

  function sair() {
    limparSessao()
    navigate('/')
  }

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="brand">
          Sistema CIF
        </Link>

        {estaNaAreaRestrita ? (
          <nav className="main-nav">
            {sessao.perfil === 'profissional' ? (
              <>
                <Link to="/sistema">Início</Link>

                <Link to="/sistema/pacientes">
                  Pacientes
                </Link>
              </>
            ) : sessao.perfil === 'pesquisador' ? (
              <Link to="/pesquisa">Pesquisa</Link>
            ) : (
              <Link to="/admin">Usuários</Link>
            )}

            <div className="user-area">
              <div className="user-info">
                <strong>{sessao.nome}</strong>
                <span>{PERFIS[sessao.perfil].rotulo}</span>
              </div>

              <button
                type="button"
                className="logout-link"
                onClick={sair}
              >
                Sair
              </button>
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