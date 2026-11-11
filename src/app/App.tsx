import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BlockageDetail from '../screens/BlockageDetail';
import Blockages from '../screens/Blockages';
import Conversation from '../screens/Conversation';
import Diagnostic from '../screens/Diagnostic';
import History from '../screens/History';
import Home from '../screens/Home';
import Privacy from '../screens/Privacy';
import Profile from '../screens/Profile';
import Progression from '../screens/Progression';
import Search from '../screens/Search';
import styles from './Layout.module.css';
import { TabLayout } from './TabLayout';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route index element={<Home />} />
        <Route path="progression" element={<Progression />} />
        <Route path="blocages" element={<Blockages />} />
        <Route path="profil" element={<Profile />} />
      </Route>
      <Route path="recherche" element={<Search />} />
      <Route path="conversation" element={<Conversation />} />
      <Route path="diagnostic/:id" element={<Diagnostic />} />
      <Route path="blocages/:key" element={<BlockageDetail />} />
      <Route path="profil/historique" element={<History />} />
      <Route path="profil/confidentialite" element={<Privacy />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <div className={styles.app}>
        <AppRoutes />
      </div>
    </BrowserRouter>
  );
}
