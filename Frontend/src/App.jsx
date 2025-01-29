import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthForm from './components/auth/AuthForm';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import Game from './gamePages/Game';
import GameConfig from './pages/GameConfig';
import NotFound from './pages/NotFound';

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/auth" />;
};

function App() {
    return (
        <Router>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
            <Routes>
                {/* Landing page - trang chủ công khai */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Trang đăng nhập/đăng ký */}
                <Route path="/auth" element={<AuthForm />} />
                
                {/* Trang chủ sau đăng nhập */}
                <Route path="/home" element={
                    <PrivateRoute>
                        <Home />
                    </PrivateRoute>
                } />

                {/* Trang cấu hình game */}
                <Route path="/game-config/:roomId" element={
                    <PrivateRoute>
                        <GameConfig />
                    </PrivateRoute>
                } />
                
                {/* Trang game */}
                <Route path="/game/:roomId" element={
                    <PrivateRoute>
                        <Game />
                    </PrivateRoute>
                } />
                
                {/* Trang 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
