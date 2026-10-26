
import { useEffect, useState } from 'react'

import { authFetch } from '../auth'
import SolicitacoesCadastro from '../components/SolicitacoesCadastro'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const ROTULOS = {
  profissional: 'Profissional de saúde',
  pesquisador: 'Pesquisador',
  administrador: 'Administrador',
}

const FORMULARIO_VAZIO = {
  login: '',
  senha: '',
  perfil: 'profissional',
  nome: '',
  conselho: '',
  registro: '',
}

async function lerErro(resposta, padrao) {
  const dados = await resposta.json().catch(() => ({}))
  if (typeof dados.detail === 'string') return dados.detail
  if (Array.isArray(dados.detail)) return 'Confira os campos informados.'
  return padrao
}

function Admin() {
  const [usuarios, setUsuarios] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erroLista, setErroLista] = useState('')

  const [formulario, setFormulario] = useState(FORMULARIO_VAZIO)
  const [erroForm, setErroForm] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [criando, setCriando] = useState(false)

  const [redefinindoId, setRedefinindoId] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [erroLinha, setErroLinha] = useState('')

  async function carregarUsuarios() {
    try {
      const resposta = await authFetch(`${API_BASE}/admin/usuarios`)
      if (!resposta.ok) {
        throw new Error('Não foi possível carregar os usuários.')
      }

      setUsuarios(await resposta.json())
      setErroLista('')
    } catch (erro) {
      setErroLista(erro.message || 'Não foi possível conectar à API.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    async function carregarInicial() {
      try {
        const resposta = await authFetch(`${API_BASE}/admin/usuarios`)
        if (!resposta.ok) {
          throw new Error('Não foi possível carregar os usuários.')
        }

        setUsuarios(await resposta.json())
      } catch (erro) {
        setErroLista(erro.message || 'Não foi possível conectar à API.')
      } finally {
        setCarregando(false)
      }
    }

    carregarInicial()
  }, [])

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }))
  }

  async function criarUsuario(evento) {
    evento.preventDefault()
    setErroForm('')
    setSucesso('')
    setCriando(true)

    const corpo = {
      login: formulario.login.trim(),
      senha: formulario.senha,
      perfil: formulario.perfil,
      ...(formulario.perfil === 'profissional' && {
        nome: formulario.nome.trim(),
        conselho: formulario.conselho.trim(),
        registro: formulario.registro.trim(),
      }),
    }

    try {
      const resposta = await authFetch(`${API_BASE}/admin/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      })

      if (!resposta.ok) {
        throw new Error(
          await lerErro(resposta, 'Não foi possível criar o usuário.')
        )
      }

      setSucesso(`Usuário "${corpo.login}" criado.`)
      setFormulario(FORMULARIO_VAZIO)
      await carregarUsuarios()
    } catch (erro) {
      setErroForm(erro.message || 'Não foi possível conectar à API.')
    } finally {
      setCriando(false)
    }
  }

  async function alterarAtivo(usuario) {
    setErroLinha('')

    try {
      const resposta = await authFetch(
        `${API_BASE}/admin/usuarios/${usuario.id}/ativo`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ativo: !usuario.ativo }),
        }
      )

      if (!resposta.ok) {
        setErroLinha(
          await lerErro(resposta, 'Não foi possível alterar a conta.')
        )
        return
      }

      await carregarUsuarios()
    } catch (erro) {
      setErroLinha(erro.message || 'Não foi possível conectar à API.')
    }
  }

  async function redefinirSenha(evento, usuario) {
    evento.preventDefault()
    setErroLinha('')

    try {
      const resposta = await authFetch(
        `${API_BASE}/admin/usuarios/${usuario.id}/senha`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha: novaSenha }),
        }
      )

      if (!resposta.ok) {
        setErroLinha(
          await lerErro(resposta, 'Não foi possível redefinir a senha.')
        )
        return
      }

      setSucesso(`Senha de "${usuario.login}" redefinida.`)
      setRedefinindoId('')
      setNovaSenha('')
    } catch (erro) {
      setErroLinha(erro.message || 'Não foi possível conectar à API.')
    }
  }

  return (
    <main className="patients-page">
      <section className="page-heading">
        <span className="page-tag">Administração</span>

        <h1>Usuários</h1>

        <p>
          Gerencie os acessos de profissionais, pesquisadores e
          administradores. Esta área não acessa dados de pacientes.
        </p>
      </section>

      <SolicitacoesCadastro />

      <section className="patients-grid">
        <section className="patient-card patient-list-card">
          <div className="card-heading">
            <span className="card-eyebrow">Contas</span>
            <h2>Usuários cadastrados</h2>
          </div>

          {carregando && (
            <p className="search-status">
              Carregando usuários...
            </p>
          )}

          {erroLista && (
            <p className="form-error" role="alert">
              {erroLista}
            </p>
          )}

          {erroLinha && (
            <p className="form-error" role="alert">
              {erroLinha}
            </p>
          )}

          <div className="patient-list">
            {!carregando && !erroLista && usuarios.length === 0 && (
              <div className="empty-state">
                Nenhum usuário cadastrado.
              </div>
            )}

            {usuarios.map((usuario) => (
              <article
                key={usuario.id}
                className={
                  usuario.ativo
                    ? 'user-row'
                    : 'user-row user-row-inactive'
                }
              >
                <div className="user-row-info">
                  <strong>{usuario.login}</strong>

                  <span>
                    {ROTULOS[usuario.perfil]}
                    {usuario.nome ? ` · ${usuario.nome}` : ''}
                  </span>
                </div>

                <span
                  className={
                    usuario.ativo
                      ? 'status-badge'
                      : 'status-badge status-badge-off'
                  }
                >
                  {usuario.ativo ? 'Ativa' : 'Desativada'}
                </span>

                <div className="user-row-actions">
                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={() => alterarAtivo(usuario)}
                  >
                    {usuario.ativo ? 'Desativar' : 'Ativar'}
                  </button>

                  <button
                    type="button"
                    className="secondary-action-button"
                    onClick={() => {
                      setRedefinindoId(
                        redefinindoId === usuario.id ? '' : usuario.id
                      )
                      setNovaSenha('')
                      setErroLinha('')
                    }}
                  >
                    Redefinir senha
                  </button>
                </div>

                {redefinindoId === usuario.id && (
                  <form
                    className="user-row-reset"
                    onSubmit={(evento) =>
                      redefinirSenha(evento, usuario)
                    }
                  >
                    <input
                      type="password"
                      value={novaSenha}
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Nova senha (mín. 8 caracteres)"
                      aria-label={`Nova senha de ${usuario.login}`}
                      onChange={(evento) =>
                        setNovaSenha(evento.target.value)
                      }
                      required
                    />

                    <button
                      type="submit"
                      className="primary-action-button"
                    >
                      Salvar
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="patient-card patient-form-card">
          <div className="card-heading">
            <span className="card-eyebrow">Novo acesso</span>

            <h2>Criar usuário</h2>

            <p>
              Informe a senha inicial e repasse ao usuário
              por um canal seguro.
            </p>
          </div>

          <form className="patient-form" onSubmit={criarUsuario}>
            <div className="form-group">
              <label htmlFor="novo-perfil">
                Tipo de acesso
              </label>

              <select
                id="novo-perfil"
                value={formulario.perfil}
                onChange={(evento) =>
                  alterarCampo('perfil', evento.target.value)
                }
              >
                {Object.entries(ROTULOS).map(
                  ([chave, rotulo]) => (
                    <option key={chave} value={chave}>
                      {rotulo}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="novo-login">
                Usuário
              </label>

              <input
                id="novo-login"
                type="text"
                value={formulario.login}
                minLength={3}
                maxLength={60}
                pattern="[A-Za-z0-9._\-]+"
                title="Use letras, números, ponto, hífen ou sublinhado"
                autoComplete="off"
                onChange={(evento) =>
                  alterarCampo('login', evento.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="novo-senha">
                Senha inicial
              </label>

              <input
                id="novo-senha"
                type="password"
                value={formulario.senha}
                minLength={8}
                autoComplete="new-password"
                placeholder="Mínimo de 8 caracteres"
                onChange={(evento) =>
                  alterarCampo('senha', evento.target.value)
                }
                required
              />
            </div>

            {formulario.perfil === 'profissional' && (
              <>
                <div className="form-group">
                  <label htmlFor="novo-nome">
                    Nome completo
                  </label>

                  <input
                    id="novo-nome"
                    type="text"
                    value={formulario.nome}
                    maxLength={200}
                    onChange={(evento) =>
                      alterarCampo('nome', evento.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="novo-conselho">
                    Conselho profissional
                  </label>

                  <input
                    id="novo-conselho"
                    type="text"
                    value={formulario.conselho}
                    maxLength={120}
                    placeholder="Ex.: CREFITO"
                    onChange={(evento) =>
                      alterarCampo('conselho', evento.target.value)
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="novo-registro">
                    Número de registro
                  </label>

                  <input
                    id="novo-registro"
                    type="text"
                    value={formulario.registro}
                    maxLength={80}
                    onChange={(evento) =>
                      alterarCampo('registro', evento.target.value)
                    }
                    required
                  />
                </div>
              </>
            )}

            {erroForm && (
              <p className="form-error" role="alert">
                {erroForm}
              </p>
            )}

            {sucesso && (
              <p className="form-success" role="status">
                {sucesso}
              </p>
            )}

            <button
              className="primary-action-button"
              type="submit"
              disabled={criando}
            >
              {criando ? 'Criando...' : 'Criar usuário'}
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}

export default Admin
