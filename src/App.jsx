import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './routes/Home'
import AdminLogin from './routes/AdminLogin'
import AdminDashboard from './routes/AdminDashboard'
import ProtectedRoute from './components/admin/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route index element={<AdminDashboard />} />
          {/* Les sous-routes admin seront ajoutees ici dans les phases suivantes */}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
