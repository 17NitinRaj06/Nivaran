import { Outlet } from 'react-router-dom';
import Navbar from '../components/ui/Navbar';
import ChatbotWidget from '../components/chatbot/ChatbotWidget';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <ChatbotWidget />
    </div>
  );
}
