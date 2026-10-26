
import { useEffect, useState } from 'react'

import { authFetch } from '../auth'

const API_BASE = import.meta.env.VITE_API_BASE || ''

const ROTULOS = {
  profissional: 'Profissional de saúde',
  pesquisador: 'Pesquisador',
}

async function obterMensagemErro(resposta) {
  const dados = await resposta.json().catch(() => ({}))

  if (resposta.status === 401 || resposta.status === 403) {
    return 'É necessário entrar com uma conta de administrador.'
  }

  if (typeof dados.detail === 'string') {
    return dados.detail
  }

  return 'Não foi possível realizar a operação.'
}

function SolicitacoesCadastro() {
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [processandoId, setProcessandoId] = useState(null)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    let ativo = true

    async function buscarSolicitacoes() {
      try {
        const resposta = await authFetch(
          `${API_BASE}/admin/solicitacoes`
        )

        if (!resposta.ok) {
          throw new Error(await obterMensagemErro(resposta))
        }

        const dados = await resposta.json()

        if (!Array.isArray(dados)) {
          throw new Error('Resposta inesperada do servidor.')
        }

        if (ativo) {
          setSolicitacoes(dados)
          setErro('')
        }
      } catch (erroRequisicao) {
        if (ativo) {
          setErro(
            erroRequisicao.message ||
              'Não foi possível carregar as solicitações.'
          )
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    buscarSolicitacoes()

    return () => {
      ativo = false
    }
  }, [])

  async function carregarSolicitacoes() {
    setCarregando(true)
    setErro('')

    try {
      const resposta = await authFetch(
        `${API_BASE}/admin/solicitacoes`
      )

      if (!resposta.ok) {
        throw new Error(await obterMensagemErro(resposta))
      }

      const dados = await resposta.json()

      if (!Array.isArray(dados)) {
        throw new Error('Resposta inesperada do servidor.')
      }

      setSolicitacoes(dados)
    } catch (erroRequisicao) {
      setErro(
        erroRequisicao.message ||
          'Não foi possível carregar as solicitações.'
      )
    } finally {
      setCarregando(false)
    }
  }

  async function decidirSolicitacao(id, status) {
    const acao = status === 'aprovado' ? 'aprovar' : 'rejeitar'

    if (!window.confirm(`Deseja realmente ${acao} esta solicitação?`)) {
      return
    }

    setProcessandoId(id)
    setErro('')
    setMensagem('')

    try {
      const resposta = await authFetch(
        `${API_BASE}/admin/solicitacoes/${id}/decisao`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status_acesso: status,
          }),
        }
      )

      if (!resposta.ok) {
        throw new Error(await obterMensagemErro(resposta))
      }

      const dados = await resposta.json()

      setMensagem(
        dados.mensagem ||
          (status === 'aprovado'
            ? 'Solicitação aprovada.'
            : 'Solicitação rejeitada.')
      )

      await carregarSolicitacoes()
    } catch (erroRequisicao) {
      setErro(
        erroRequisicao.message ||
          'Não foi possível analisar a solicitação.'
      )
    } finally {
      setProcessandoId(null)
    }
  }

  const pendentes = solicitacoes.filter(
    (solicitacao) => solicitacao.status_acesso === 'pendente'
  )

  const analisadas = solicitacoes.filter(
    (solicitacao) => solicitacao.status_acesso !== 'pendente'
  )

  return (
    <section className="patient-card patient-list-card">
      <div className="card-heading">
        <span className="card-eyebrow">
          Administração de acessos
        </span>

        <h2>Solicitações de cadastro</h2>

        <p>
          Analise os pedidos de acesso de profissionais de
          saúde e pesquisadores.
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className="secondary-action-button"
          onClick={carregarSolicitacoes}
          disabled={carregando || processandoId !== null}
        >
          {carregando ? 'Atualizando...' : 'Atualizar solicitações'}
        </button>
      </div>

      {erro && (
        <p className="form-error" role="alert">
          {erro}
        </p>
      )}

      {mensagem && (
        <p className="form-success" role="status">
          {mensagem}
        </p>
      )}

      {carregando ? (
        <p className="search-status">
          Carregando solicitações...
        </p>
      ) : !erro ? (
        <>
          <h3>
            Solicitações pendentes ({pendentes.length})
          </h3>

          <div className="patient-list">
            {pendentes.length === 0 && (
              <p className="empty-state">
                Nenhuma solicitação pendente.
              </p>
            )}

            {pendentes.map((solicitacao) => (
              <article className="user-row" key={solicitacao.id}>
                <div className="user-row-info">
                  <strong>{solicitacao.nome}</strong>
                  <span>
                    {ROTULOS[solicitacao.perfil] ||
                      solicitacao.perfil}
                  </span>
                  <span>Usuário: {solicitacao.usuario}</span>
                  <span>E-mail: {solicitacao.email}</span>
                  <span>
                    Instituição: {solicitacao.instituicao}
                  </span>

                  {solicitacao.perfil === 'profissional' && (
                    <>
                      <span>
                        Conselho: {solicitacao.conselho}
                      </span>
                      <span>
                        Registro: {solicitacao.registro}
                      </span>

                      {solicitacao.especialidade && (
                        <span>
                          Especialidade: {solicitacao.especialidade}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <span className="status-badge">
                  Pendente
                </span>

                <div className="user-row-actions">
                  <button
                    type="button"
                    className="primary-action-button"
                    disabled={processandoId !== null}
                    onClick={() =>
                      decidirSolicitacao(
                        solicitacao.id,
                        'aprovado'
                      )
                    }
                  >
                    {processandoId === solicitacao.id
                      ? 'Processando...'
                      : 'Aprovar'}
                  </button>

                  <button
                    type="button"
                    className="secondary-action-button"
                    disabled={processandoId !== null}
                    onClick={() =>
                      decidirSolicitacao(
                        solicitacao.id,
                        'rejeitado'
                      )
                    }
                  >
                    Rejeitar
                  </button>
                </div>
              </article>
            ))}
          </div>

          {analisadas.length > 0 && (
            <>
              <h3 style={{ marginTop: '24px' }}>
                Solicitações analisadas
              </h3>

              <div className="patient-list">
                {analisadas.map((solicitacao) => (
                  <article
                    className="user-row"
                    key={solicitacao.id}
                  >
                    <div className="user-row-info">
                      <strong>{solicitacao.nome}</strong>
                      <span>
                        {ROTULOS[solicitacao.perfil] ||
                          solicitacao.perfil}
                      </span>
                      <span>{solicitacao.email}</span>
                      <span>
                        Instituição: {solicitacao.instituicao}
                      </span>
                    </div>

                    <span className="status-badge">
                      {solicitacao.status_acesso === 'aprovado'
                        ? 'Aprovado'
                        : 'Rejeitado'}
                    </span>
                  </article>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <p>
          Não foi possível consultar as solicitações.
          Verifique a conexão e as permissões do administrador.
        </p>
      )}
    </section>
  )
}

export default SolicitacoesCadastro
