import { Outlet } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import ChatbotWidget from '../components/chatbot/ChatbotWidget';
export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-beige-50/50 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col lg:ml-64">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ChatbotWidget />
    </div>
  );
}
