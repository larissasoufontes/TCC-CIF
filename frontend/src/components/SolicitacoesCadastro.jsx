
import { useState } from 'react'

const SOLICITACOES_EXEMPLO = [
  {
    id: 1,
    nome: 'Ana Silva',
    email: 'ana.exemplo@universidade.edu.br',
    perfil: 'profissional',
    instituicao: 'Hospital Exemplo',
    conselho: 'CREFITO',
    registro: '123456',
    status: 'pendente',
  },
  {
    id: 2,
    nome: 'Carlos Souza',
    email: 'carlos.exemplo@universidade.edu.br',
    perfil: 'pesquisador',
    instituicao: 'Universidade Exemplo',
    status: 'pendente',
  },
]

const ROTULOS = {
  profissional: 'Profissional de saúde',
  pesquisador: 'Pesquisador',
}

function SolicitacoesCadastro() {
  const [solicitacoes, setSolicitacoes] = useState(
    SOLICITACOES_EXEMPLO
  )

  function alterarStatus(id, status) {
    setSolicitacoes((atuais) =>
      atuais.map((solicitacao) =>
        solicitacao.id === id
          ? { ...solicitacao, status }
          : solicitacao
      )
    )
  }

  const pendentes = solicitacoes.filter(
    (solicitacao) => solicitacao.status === 'pendente'
  )

  const analisadas = solicitacoes.filter(
    (solicitacao) => solicitacao.status !== 'pendente'
  )

  return (
    <section className="patient-card patient-list-card">
      <div className="card-heading">
        <span className="card-eyebrow">
          Protótipo administrativo
        </span>

        <h2>Solicitações de cadastro</h2>

        <p>
          Analise os pedidos de acesso de profissionais de saúde
          e pesquisadores.
        </p>

        <p>
          Demonstração com dados fictícios. As decisões não são
          salvas no banco de dados.
        </p>
      </div>

      <h3>Solicitações pendentes ({pendentes.length})</h3>

      <div className="patient-list">
        {pendentes.length === 0 && (
          <p className="empty-state">
            Nenhuma solicitação pendente.
          </p>
        )}

        {pendentes.map((solicitacao) => (
          <article
            className="user-row"
            key={solicitacao.id}
          >
            <div className="user-row-info">
              <strong>{solicitacao.nome}</strong>

              <span>{ROTULOS[solicitacao.perfil]}</span>
              <span>{solicitacao.email}</span>
              <span>
                Instituição: {solicitacao.instituicao}
              </span>

              {solicitacao.perfil === 'profissional' && (
                <span>
                  {solicitacao.conselho} — {solicitacao.registro}
                </span>
              )}
            </div>

            <span className="status-badge">
              Pendente
            </span>

            <div className="user-row-actions">
              <button
                type="button"
                className="primary-action-button"
                onClick={() =>
                  alterarStatus(solicitacao.id, 'aprovado')
                }
              >
                Aprovar
              </button>

              <button
                type="button"
                className="secondary-action-button"
                onClick={() =>
                  alterarStatus(solicitacao.id, 'rejeitado')
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
                  <span>{ROTULOS[solicitacao.perfil]}</span>
                  <span>{solicitacao.email}</span>
                </div>

                <span className="status-badge">
                  {solicitacao.status === 'aprovado'
                    ? 'Aprovado'
                    : 'Rejeitado'}
                </span>

                <button
                  type="button"
                  className="secondary-action-button"
                  onClick={() =>
                    alterarStatus(solicitacao.id, 'pendente')
                  }
                >
                  Desfazer decisão
                </button>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default SolicitacoesCadastro
