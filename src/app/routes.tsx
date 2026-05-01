import { createBrowserRouter } from "react-router";
import { MainMenu } from "./screens/MainMenu";
import { ModeSelection } from "./screens/ModeSelection";
import { CharacterSelection } from "./screens/CharacterSelection";
import { OnlineMatchmaking } from "./screens/OnlineMatchmaking";
import { GameScreen } from "./screens/GameScreen";
import { ResultScreen } from "./screens/ResultScreen";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: MainMenu,
  },
  {
    path: "/mode-selection",
    Component: ModeSelection,
  },
  {
    path: "/character-selection",
    Component: CharacterSelection,
  },
  {
    path: "/online-matchmaking",
    Component: OnlineMatchmaking,
  },
  {
    path: "/game",
    Component: GameScreen,
  },
  {
    path: "/result",
    Component: ResultScreen,
  },
]);
