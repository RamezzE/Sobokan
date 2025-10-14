import { Outlet } from "react-router-dom";
import Footer from "./components/Footer";

const App = () => {
  return (
    <div className="flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 min-h-screen">
      <Outlet />
      <Footer />
    </div>
  )
}

export default App