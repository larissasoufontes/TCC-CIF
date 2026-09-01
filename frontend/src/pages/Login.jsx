import { useNavigate } from 'react-router-dom'

function Login() {
  const navigate = useNavigate()

  function entrarNoSistema(evento) {
    evento.preventDefault()

    navigate('/sistema')
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="card-heading">
          <span className="card-eyebrow">Área restrita</span>

          <h1>Entrar no sistema</h1>

          <p>
            Informe suas credenciais para acessar a plataforma.
          </p>
        </div>

        <form className="patient-form" onSubmit={entrarNoSistema}>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>

            <input
              id="email"
              type="email"
              placeholder="seuemail@instituicao.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>

            <input
              id="senha"
              type="password"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button className="primary-action-button" type="submit">
            Entrar
          </button>
        </form>

        <p className="login-warning">
          Autenticação provisória utilizada apenas durante o desenvolvimento.
        </p>
      </section>
    </main>
  )
}

export default Login