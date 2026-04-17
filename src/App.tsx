import { Scene } from './components/Scene';
import { ChatUI } from './components/ChatUI';

function App() {
  return (
    <>
      {/* 3D Canvas — background layer */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1,
        overflow: 'hidden',
        background: '#0d1123',
      }}>
        <Scene />
      </div>
      
      {/* Chat UI — foreground layer, rendered outside canvas container */}
      <ChatUI />
    </>
  );
}

export default App;
