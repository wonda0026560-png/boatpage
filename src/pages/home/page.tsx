import { useState } from 'react';
import Cursor from '../../components/layout/Cursor';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import Loader from './components/Loader';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import BentoGrid from './components/BentoGrid';
import Manifesto from './components/Manifesto';
import StackedPanels from './components/StackedPanels';
import Statement from './components/Statement';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';

export default function Home() {
  const [loaderDone, setLoaderDone] = useState(false);

  // 로더가 끝나기 전에는 스크롤을 붙잡지 않는다.
  useSmoothScroll({ enabled: loaderDone });

  return (
    <>
      <Cursor />
      <Loader onComplete={() => setLoaderDone(true)} />
      <Header />
      <main>
        <Hero />
        <Marquee />
        <BentoGrid />
        <Manifesto />
        <StackedPanels />
        <Statement />
      </main>
      <Footer />
    </>
  );
}
