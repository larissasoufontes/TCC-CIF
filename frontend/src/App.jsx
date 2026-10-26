import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Header from './components/Header'
import RotaProtegida from './components/RotaProtegida'

import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetails from './pages/PatientDetails'
import Research from './pages/Research'
import Admin from './pages/Admin'


function App() {
  return (
    <BrowserRouter>
      <Header />

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/login"
          element={<Login />}
        />
        <Route 
          path="/cadastro" 
          element={<Cadastro />} 
        />

        <Route
          path="/sistema"
          element={
            <RotaProtegida perfil="profissional">
              <Dashboard />
            </RotaProtegida>
          }
        />

        <Route
          path="/sistema/pacientes"
          element={
            <RotaProtegida perfil="profissional">
              <Patients />
            </RotaProtegida>
          }
        />

        <Route
          path="/sistema/pacientes/:id"
          element={
            <RotaProtegida perfil="profissional">
              <PatientDetails />
            </RotaProtegida>
          }
        />

        <Route
          path="/pesquisa"
          element={
            <RotaProtegida perfil="pesquisador">
              <Research />
            </RotaProtegida>
          }
        />

        <Route
          path="/admin"
          element={
            <RotaProtegida perfil="administrador">
              <Admin />
            </RotaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App