import { Link } from 'react-router-dom'

function Dashboard() {
  return (
    <main className="dashboard-page">
      <section className="page-heading">
        <span className="page-tag">Área restrita</span>

        <h1>Visão geral</h1>

        <p>
          Acesse as funcionalidades disponíveis no Sistema CIF.
        </p>
      </section>

      <section className="dashboard-grid">
        <Link
          to="/sistema/pacientes"
          className="dashboard-card"
        >
          <span className="dashboard-number">01</span>

          <h2>Pacientes</h2>

          <p>
            Consulte, cadastre e atualize pacientes disponíveis
            para sua instituição.
          </p>

          <span className="dashboard-link">
            Acessar pacientes →
          </span>
        </Link>
      </section>
    </main>
  )
}

export default Dashboard