import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Header from './components/Header'

import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetails from './pages/PatientDetails'

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
          path="/sistema"
          element={<Dashboard />}
        />

        <Route
          path="/sistema/pacientes"
          element={<Patients />}
        />

        <Route
          path="/sistema/pacientes/:id"
          element={<PatientDetails />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App