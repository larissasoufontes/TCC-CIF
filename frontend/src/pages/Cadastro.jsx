
import { useState } from 'react'
import { Link } from 'react-router-dom'

const FORMULARIO_INICIAL = {
  perfil: 'profissional',
  nome: '',
  usuario: '',
  email: '',
  instituicao: '',
  conselho: '',
  registro: '',
  especialidade: '',
  senha: '',
  confirmarSenha: '',
}

function Cadastro() {
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)
  const [erro, setErro] = useState('')
  const [enviado, setEnviado] = useState(false)

  function alterarCampo(campo, valor) {
    setFormulario((atual) => ({
      ...atual,
      [campo]: valor,
    }))

    setErro('')
  }

  function enviarCadastro(evento) {
    evento.preventDefault()
    setErro('')

    const usuario = formulario.usuario.trim()

    if (!/^[A-Za-z0-9._-]{3,60}$/.test(usuario)) {
      setErro(
        'O usuário deve conter de 3 a 60 caracteres, usando letras, números, ponto, hífen ou sublinhado.'
      )
      return
    }

    if (formulario.senha.length < 8) {
      setErro('A senha deve conter pelo menos 8 caracteres.')
      return
    }

    if (formulario.senha !== formulario.confirmarSenha) {
      setErro('As senhas informadas não coincidem.')
      return
    }

    if (
      formulario.perfil === 'profissional' &&
      (!formulario.conselho.trim() || !formulario.registro.trim())
    ) {
      setErro('Informe o conselho e o registro profissional.')
      return
    }

    // PROTÓTIPO:
    // Nenhum dado é enviado ao backend ou armazenado.
    // A integração com a API e o fluxo de aprovação
    // serão implementados posteriormente.

    setEnviado(true)
  }

  if (enviado) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="card-heading">
            <span className="card-eyebrow">
              Protótipo de cadastro
            </span>

            <h1>Cadastro preenchido!</h1>

            <p>
              O formulário de solicitação foi preenchido
              corretamente.
            </p>

            <p>
              No sistema completo, sua solicitação ficará
              pendente até ser analisada por um administrador.
              Após a aprovação, será possível acessar a área
              correspondente ao seu perfil.
            </p>

            <p>
              Esta é uma demonstração. Nenhum cadastro foi
              enviado ou salvo no banco de dados.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <button
              type="button"
              className="primary-action-button"
              onClick={() => {
                setFormulario(FORMULARIO_INICIAL)
                setEnviado(false)
                setErro('')
              }}
            >
              Simular outro cadastro
            </button>

            <p style={{ textAlign: 'center' }}>
              <Link to="/login">
                Voltar para o login
              </Link>
            </p>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="card-heading">
          <span className="card-eyebrow">
            Solicitação de acesso
          </span>

          <h1>Criar conta</h1>

          <p>
            Preencha seus dados para solicitar acesso ao Sistema CIF.
            O cadastro ficará sujeito à aprovação de um administrador.
          </p>
        </div>

        <form className="patient-form" onSubmit={enviarCadastro}>
          <div className="form-group">
            <label htmlFor="cadastro-perfil">
              Tipo de usuário
            </label>

            <select
              id="cadastro-perfil"
              value={formulario.perfil}
              onChange={(evento) =>
                alterarCampo('perfil', evento.target.value)
              }
            >
              <option value="profissional">
                Profissional de saúde
              </option>

              <option value="pesquisador">
                Pesquisador
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cadastro-nome">
              Nome completo
            </label>

            <input
              id="cadastro-nome"
              type="text"
              value={formulario.nome}
              maxLength={200}
              autoComplete="name"
              placeholder="Digite seu nome completo"
              onChange={(evento) =>
                alterarCampo('nome', evento.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cadastro-usuario">
              Nome de usuário
            </label>

            <input
              id="cadastro-usuario"
              type="text"
              value={formulario.usuario}
              minLength={3}
              maxLength={60}
              pattern="[A-Za-z0-9._-]+"
              title="Use letras, números, ponto, hífen ou sublinhado"
              autoComplete="username"
              placeholder="Ex.: maria.silva"
              onChange={(evento) =>
                alterarCampo('usuario', evento.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cadastro-email">
              E-mail
            </label>

            <input
              id="cadastro-email"
              type="email"
              value={formulario.email}
              maxLength={254}
              autoComplete="email"
              placeholder="Digite seu e-mail"
              onChange={(evento) =>
                alterarCampo('email', evento.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cadastro-instituicao">
              Instituição de vínculo
            </label>

            <input
              id="cadastro-instituicao"
              type="text"
              value={formulario.instituicao}
              maxLength={200}
              placeholder="Nome da instituição"
              onChange={(evento) =>
                alterarCampo('instituicao', evento.target.value)
              }
              required
            />
          </div>

          {formulario.perfil === 'profissional' && (
            <>
              <div className="form-group">
                <label htmlFor="cadastro-conselho">
                  Conselho profissional
                </label>

                <input
                  id="cadastro-conselho"
                  type="text"
                  value={formulario.conselho}
                  maxLength={120}
                  placeholder="Ex.: CRM, COREN, CREFITO"
                  onChange={(evento) =>
                    alterarCampo('conselho', evento.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cadastro-registro">
                  Número do registro profissional
                </label>

                <input
                  id="cadastro-registro"
                  type="text"
                  value={formulario.registro}
                  maxLength={80}
                  placeholder="Número do conselho"
                  onChange={(evento) =>
                    alterarCampo('registro', evento.target.value)
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cadastro-especialidade">
                  Especialidade
                </label>

                <input
                  id="cadastro-especialidade"
                  type="text"
                  value={formulario.especialidade}
                  maxLength={150}
                  placeholder="Ex.: Fisioterapia"
                  onChange={(evento) =>
                    alterarCampo('especialidade', evento.target.value)
                  }
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="cadastro-senha">
              Senha
            </label>

            <input
              id="cadastro-senha"
              type="password"
              value={formulario.senha}
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              onChange={(evento) =>
                alterarCampo('senha', evento.target.value)
              }
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cadastro-confirmar-senha">
              Confirmar senha
            </label>

            <input
              id="cadastro-confirmar-senha"
              type="password"
              value={formulario.confirmarSenha}
              minLength={8}
              maxLength={200}
              autoComplete="new-password"
              placeholder="Digite a senha novamente"
              onChange={(evento) =>
                alterarCampo('confirmarSenha', evento.target.value)
              }
              required
            />
          </div>

          {erro && (
            <p className="form-error" role="alert">
              {erro}
            </p>
          )}

          <button
            className="primary-action-button"
            type="submit"
          >
            Simular solicitação de cadastro
          </button>

          <p style={{ textAlign: 'center', marginTop: '12px' }}>
            Já possui uma conta?{' '}
            <Link
              to="/login"
              style={{
                color: '#176b53',
                fontWeight: '600',
                textDecoration: 'underline',
              }}
            >
              Entrar
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}

export default Cadastro
