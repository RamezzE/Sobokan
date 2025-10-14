import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import LoginPage from "@/screens/auth/Login";
import SignupPage from "@/screens/auth/Signup";
import GameScreen from "@/screens/game/GameScreen";
import CreateLevel from "./screens/admin/createLevel";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { index: true, element: <LoginPage /> },
            { path: "signin", element: <LoginPage /> },
            { path: "signup", element: <SignupPage /> },
            { path: "game", element: <GameScreen /> },
            { path: "admin/create-level", element: <CreateLevel /> },
        ]
    },

]);