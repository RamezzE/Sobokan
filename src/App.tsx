import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";

const App = () => {
  return (
    <div className="flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 min-h-screen">
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}

export default App