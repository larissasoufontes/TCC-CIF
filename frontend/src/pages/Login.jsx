import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PERFIS, salvarSessao } from '../auth'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function Login() {
  const navigate = useNavigate()

  const [perfil, setPerfil] = useState('profissional')
  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [entrando, setEntrando] = useState(false)

  async function entrarNoSistema(evento) {
    evento.preventDefault()
    setErro('')
    setEntrando(true)

    try {
      const resposta = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: login.trim(), senha, perfil }),
      })

      const dados = await resposta.json().catch(() => ({}))

      if (!resposta.ok) {
        throw new Error(dados.detail || 'Não foi possível entrar.')
      }

      salvarSessao(dados)
      navigate(PERFIS[dados.perfil].inicio)
    } catch (erroLogin) {
      setErro(erroLogin.message || 'Não foi possível conectar à API.')
      setSenha('')
    } finally {
      setEntrando(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="card-heading">
          <span className="card-eyebrow">Área restrita</span>

          <h1>Entrar no sistema</h1>

          <p>
            Escolha seu tipo de acesso e informe suas credenciais.
          </p>
        </div>

        <form className="patient-form" onSubmit={entrarNoSistema}>
          <div
            className="segmented-control"
            role="group"
            aria-label="Tipo de acesso"
          >
            {Object.entries(PERFIS).map(([chave, { rotulo }]) => (
              <button
                key={chave}
                type="button"
                aria-pressed={perfil === chave}
                className={perfil === chave ? 'selected' : ''}
                onClick={() => {
                  setPerfil(chave)
                  setErro('')
                }}
              >
                {rotulo}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="login">Usuário</label>

            <input
              id="login"
              type="text"
              value={login}
              autoComplete="username"
              placeholder="Digite seu usuário"
              onChange={(evento) => setLogin(evento.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>

            <input
              id="senha"
              type="password"
              value={senha}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              onChange={(evento) => setSenha(evento.target.value)}
              required
            />
          </div>

          {erro && <p className="form-error" role="alert">{erro}</p>}

          <button
            className="primary-action-button"
            type="submit"
            disabled={entrando}
          >
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login