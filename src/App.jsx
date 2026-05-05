import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './routes/Home'
import AdminLogin from './routes/AdminLogin'
import AdminDashboard from './routes/AdminDashboard'
import AdminCustomerNew from './routes/AdminCustomerNew'
import ClientCard from './routes/ClientCard'
import ProtectedRoute from './components/admin/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/carte/:accessToken" element={<ClientCard />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminDashboard />}>
            <Route index element={null} />
            <Route path="customers/new" element={<AdminCustomerNew />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
