import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom';

// Build statique (page hébergée sans repli SPA) : routage par le fragment d'URL.
const Router = import.meta.env.VITE_STATIC === '1' ? HashRouter : BrowserRouter;
import { UpdateBanner } from '../components/UpdateBanner';
import { useApp } from '../store/appStore';
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
  const ready = useApp((s) => s.ready);
  const persistent = useApp((s) => s.persistent);
  const init = useApp((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <Router>
      <div className={styles.app} data-ready={ready}>
        {!persistent && (
          <p role="status" className={styles.banner}>
            Tes données ne seront pas conservées
          </p>
        )}
        {ready && <AppRoutes />}
        <UpdateBanner />
      </div>
    </Router>
  );
}
