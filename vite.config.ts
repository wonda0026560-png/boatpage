import { defineConfig, runnerImport, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";
import AutoImport from "unplugin-auto-import/vite";
// import { readdyJsxRuntimeProxyPlugin } from "./vite.jsx-runtime-proxy";

const base = process.env.BASE_PATH || "/";
const isPreview = process.env.IS_PREVIEW ? true : false;

/*
  공유 카드(og:image)와 canonical 은 절대 주소여야 한다. 크롤러는 페이지와
  다른 맥락에서 URL을 읽기 때문에 상대 경로로는 카카오톡·페이스북 미리보기가
  뜨지 않는다. 배포 환경에서 SITE_URL 을 넣어 주면 그 값으로 치환한다.

  값이 없으면 상대 경로로 남긴다 — 잘못된 절대 주소를 박아두는 것보다
  낫고, 도메인이 정해지는 순간 환경변수 하나로 완성된다.
*/
const siteUrl = (process.env.SITE_URL || "").replace(/\/$/, "");

function htmlSiteUrlPlugin() {
  return {
    name: "inject-site-url",
    transformIndexHtml(html: string) {
      return html.replaceAll("%SITE_URL%", siteUrl);
    },
  };
}

/*
  페이지별 검색 제목·설명(src/data/seo.ts)을 out/site-routes.json 으로 내보낸다.
  서버(server/index.js)는 TS 도, 이미지 import 도 읽지 못하므로 빌드 때
  vite 의 모듈 러너로 한 번 실행해서 결과만 JSON 으로 남긴다.
  서버는 이 파일로 sitemap.xml 을 만들고 각 경로의 <head> 를 채운다.
*/
function siteRoutesPlugin(): Plugin {
  return {
    name: "emit-site-routes",
    apply: "build",
    async closeBundle() {
      const { module } = await runnerImport<typeof import("./src/data/seo")>(
        resolve(__dirname, "src/data/seo.ts"),
        { configFile: false, logLevel: "error" }
      );
      const routes = module.siteRoutes();
      writeFileSync(resolve(__dirname, "out/site-routes.json"), JSON.stringify(routes, null, 2));
      console.log(`[site-routes] ${routes.length} routes → out/site-routes.json`);
    },
  };
}
//const proxyPlugins = isPreview ? [readdyJsxRuntimeProxyPlugin()] : [];
// https://vite.dev/config/
export default defineConfig({
  define: {
    __BASE_PATH__: JSON.stringify(base),
    __IS_PREVIEW__: JSON.stringify(isPreview),
    __READDY_PROJECT_ID__: JSON.stringify(process.env.PROJECT_ID || ""),
    __READDY_VERSION_ID__: JSON.stringify(process.env.VERSION_ID || ""),
    __READDY_AI_DOMAIN__: JSON.stringify(process.env.READDY_AI_DOMAIN || ""),
  },
  plugins: [
    // ...proxyPlugins,
    htmlSiteUrlPlugin(),
    siteRoutesPlugin(),
    react(),
    AutoImport({
      imports: [
        {
          react: [
            ["default", "React"],
            "useState",
            "useEffect",
            "useContext",
            "useReducer",
            "useCallback",
            "useMemo",
            "useRef",
            "useImperativeHandle",
            "useLayoutEffect",
            "useDebugValue",
            "useDeferredValue",
            "useId",
            "useInsertionEffect",
            "useSyncExternalStore",
            "useTransition",
            "startTransition",
            "lazy",
            "memo",
            "forwardRef",
            "createContext",
            "createElement",
            "cloneElement",
            "isValidElement",
          ],
        },
        {
          "react-router-dom": [
            "useNavigate",
            "useLocation",
            "useParams",
            "useSearchParams",
            "Link",
            "NavLink",
            "Navigate",
            "Outlet",
          ],
        },
        // React i18n
        {
          "react-i18next": ["useTranslation", "Trans"],
        },
      ],
      dts: true,
    }),
  ],
  base,
  build: {
    sourcemap: true,
    outDir: 'out',
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    // 개발 중에는 vite 가 화면만 띄우고 API 는 server/index.js(3002) 로 넘긴다
    proxy: { "/api": "http://localhost:3002" },
  },
  preview: {
    proxy: { "/api": "http://localhost:3002" },
  },
});
