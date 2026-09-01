import { Link } from 'react-router-dom'

function Home() {
  return (
    <main className="home-page">
      <section className="hero">
        <div className="hero-content">
          <span className="hero-tag">Classificação Internacional de Funcionalidade</span>

          <h1>Sistema CIF</h1>

          <p className="hero-description">
            Plataforma para organização de informações em saúde com base na
            Classificação Internacional de Funcionalidade, Incapacidade e Saúde.
          </p>

          <p className="hero-secondary">
            O sistema permite organizar pacientes, registrar classificações CIF,
            acompanhar informações ao longo do tempo e realizar exportações.
          </p>

          <Link to="/login" className="primary-button">
            Acessar o sistema
          </Link>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading">
          <h2>Funcionalidades da plataforma</h2>
          <p>
            Recursos desenvolvidos para apoiar a organização e o acompanhamento
            das informações relacionadas à CIF.
          </p>
        </div>

        <div className="feature-grid">
          <article className="feature-card">
            <span className="feature-number">01</span>
            <h3>Pacientes</h3>
            <p>
              Cadastro, consulta e organização das informações dos pacientes.
            </p>
          </article>

          <article className="feature-card">
            <span className="feature-number">02</span>
            <h3>Classificações CIF</h3>
            <p>
              Registro de códigos, qualificadores e informações relacionadas à
              funcionalidade do paciente.
            </p>
          </article>

          <article className="feature-card">
            <span className="feature-number">03</span>
            <h3>Exportações</h3>
            <p>
              Geração e organização de informações para exportação em formatos
              como CSV e PDF.
            </p>
          </article>
        </div>
      </section>

      <section className="privacy-section">
        <div>
          <span className="privacy-label">Acesso restrito</span>
          <h2>Proteção das informações em saúde</h2>
        </div>

        <p>
          As informações de pacientes serão disponibilizadas apenas na área
          restrita do sistema, mediante autenticação e controle de acesso.
        </p>
      </section>
    </main>
  )
}

export default Home