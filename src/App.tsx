import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import ChatButton from "./components/layout/ChatButton";


function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename={__BASE_PATH__}>
        <AppRoutes />
        {/* 라우트 밖에 두어 모든 페이지에서 같은 자리에 유지된다 */}
        <ChatButton />
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
