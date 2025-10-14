import { createBrowserRouter } from "react-router-dom";
import App from "@/App";
import LoginPage from "@/screens/auth/Login";
import SignupPage from "@/screens/auth/Signup";
import GameScreen from "@/screens/game/GameScreen";
import CreateLevel from "@/screens/admin/createLevel";
import ViewLevelsPage from "@/screens/game/ViewLevels";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { index: true, element: <LoginPage /> },
            { path: "signin", element: <LoginPage /> },
            { path: "signup", element: <SignupPage /> },
            { path: "game/view-levels", element: <ViewLevelsPage /> },
            { path: "/game/:levelId", element: <GameScreen /> },
            { path: "admin/create-level", element: <CreateLevel /> },
        ]
    },

]);