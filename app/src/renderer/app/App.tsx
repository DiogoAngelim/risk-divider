import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import HeaderTabs from "../components/HeaderTabs.tsx";
import NewPage from "../pages/New.tsx";
import ExchangePage from "../pages/Exchange.tsx";
import AssetsPage from "../pages/Assets.tsx";
import OptimizePage from "../pages/Optimize.tsx";
import DashboardPage from "../pages/Dashboard.tsx";

function Layout() {
  const location = useLocation();
  const showHeaderTabs = location.pathname !== "/" && location.pathname !== "/dashboard";

  return (
    <>
      {showHeaderTabs && <HeaderTabs />}
      <div id="main">
        <Routes>
          <Route path="/" element={<NewPage />} />
          <Route path="/profile" element={<ExchangePage />} />
          <Route path="/assets" element={<AssetsPage />} />
          <Route path="/portfolio" element={<OptimizePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
