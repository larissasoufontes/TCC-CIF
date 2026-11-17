import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useToast } from '../components/toastContext'

const API_BASE = import.meta.env.VITE_API_BASE || ''

function PasswordReset() {
  const { hash } = useLocation()
  const token = new URLSearchParams(hash.slice(1)).get('token') || ''
  const mostrarToast = useToast()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function enviarFormulario(evento) {
    evento.preventDefault()
    setErro('')
    setMensagem('')

    if (token && senha !== confirmacao) {
      setErro('As senhas não coincidem.')
      return
    }

    setEnviando(true)
    try {
      const resposta = await fetch(
        `${API_BASE}/auth/${token ? 'redefinir-senha' : 'esqueci-senha'}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            token ? { token, senha } : { email: email.trim() },
          ),
        },
      )
      const dados = await resposta.json().catch(() => ({}))
      if (!resposta.ok) {
        throw new Error(dados.detail || 'Não foi possível concluir a solicitação.')
      }

      setMensagem(
        token
          ? 'Senha redefinida. Você já pode entrar com a nova senha.'
          : dados.mensagem,
      )
      if (token) mostrarToast()
      setEmail('')
      setSenha('')
      setConfirmacao('')
    } catch (erroSolicitacao) {
      setErro(erroSolicitacao.message || 'Não foi possível conectar à API.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="card-heading">
          <span className="card-eyebrow">Acesso à conta</span>
          <h1>{token ? 'Criar nova senha' : 'Recuperar senha'}</h1>
          <p>
            {token
              ? 'Defina uma senha nova para sua conta.'
              : 'Informe o e-mail validado pelo administrador para receber o link de redefinição.'}
          </p>
        </div>

        <form className="patient-form" onSubmit={enviarFormulario}>
          {!token && (
            <div className="form-group">
              <label htmlFor="email-recuperacao">E-mail</label>
              <input
                id="email-recuperacao"
                type="email"
                value={email}
                autoComplete="email"
                onChange={(evento) => setEmail(evento.target.value)}
                required
              />
            </div>
          )}

          {token && (
            <>
              <div className="form-group">
                <label htmlFor="nova-senha">Nova senha</label>
                <input
                  id="nova-senha"
                  type="password"
                  value={senha}
                  minLength={8}
                  autoComplete="new-password"
                  onChange={(evento) => setSenha(evento.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmar-senha">Confirmar nova senha</label>
                <input
                  id="confirmar-senha"
                  type="password"
                  value={confirmacao}
                  minLength={8}
                  autoComplete="new-password"
                  onChange={(evento) => setConfirmacao(evento.target.value)}
                  required
                />
              </div>
            </>
          )}

          {erro && <p className="form-error" role="alert">{erro}</p>}
          {mensagem && <p className="form-success" role="status">{mensagem}</p>}

          <button
            className="primary-action-button"
            type="submit"
            disabled={enviando}
          >
            {enviando
              ? 'Aguarde...'
              : token
                ? 'Salvar nova senha'
                : 'Enviar link de recuperação'}
          </button>

          <p>
            <Link to="/login">Voltar para o login</Link>
          </p>
        </form>
      </section>
    </main>
  )
}

export default PasswordReset