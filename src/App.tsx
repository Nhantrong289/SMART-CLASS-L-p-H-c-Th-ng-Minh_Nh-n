import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { LandingPage } from './pages/auth/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';

// Teacher Views
import { TeacherOverview } from './pages/teacher/TeacherOverview';
import { ClassesList } from './pages/teacher/ClassesList';
import { ClassDetail } from './pages/teacher/ClassDetail';
import { StudentsList } from './pages/teacher/StudentsList';
import { AttendanceView } from './pages/teacher/AttendanceView';
import { AssignmentsView } from './pages/teacher/AssignmentsView';
import { GradebookView } from './pages/teacher/GradebookView';
import { ClassroomTools } from './pages/teacher/ClassroomTools';
import { AIAssistant } from './pages/teacher/AIAssistant';
import { AnnouncementsView } from './pages/teacher/AnnouncementsView';
import { ReportsView } from './pages/teacher/ReportsView';
import { ScheduleView } from './pages/teacher/ScheduleView';
import { QuestionBankView } from './pages/teacher/QuestionBankView';
import { AutoGradingView } from './pages/teacher/AutoGradingView';
import { DigitalDocsView } from './pages/teacher/DigitalDocsView';

// Other Portals
import { StudentPortal } from './pages/student/StudentPortal';
import { ParentPortal } from './pages/parent/ParentPortal';
import { AdminPortal } from './pages/admin/AdminPortal';
import { UserRole } from './types';

function MainApp() {
  const { user, role, switchRole } = useAuth();
  const [currentPage, setCurrentPage] = useState<'landing' | 'login' | 'app'>('app'); // Start directly in app for immediate demo
  const [activeTab, setActiveTab] = useState<string>('teacher-overview');
  const [activeClassDetailId, setActiveClassDetailId] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync tab defaults when switching roles
  const handleRoleSelectFromLogin = (r: UserRole) => {
    switchRole(r);
    setCurrentPage('app');
    if (r === 'TEACHER') setActiveTab('teacher-overview');
    if (r === 'STUDENT') setActiveTab('student-overview');
    if (r === 'PARENT') setActiveTab('parent-overview');
    if (r === 'ADMIN') setActiveTab('admin-overview');
  };

  if (currentPage === 'landing') {
    return (
      <LandingPage
        onGoToLogin={() => setCurrentPage('login')}
        onExplore={() => {
          switchRole('TEACHER');
          setCurrentPage('app');
          setActiveTab('teacher-overview');
        }}
      />
    );
  }

  if (currentPage === 'login') {
    return (
      <LoginPage
        onBackToHome={() => setCurrentPage('app')}
        onLoginSuccess={handleRoleSelectFromLogin}
      />
    );
  }

  // Render Portal according to active Role & Tab
  const renderContent = () => {
    // Role 1: TEACHER
    if (role === 'TEACHER') {
      if (activeClassDetailId) {
        return (
          <ClassDetail
            classId={activeClassDetailId}
            onBack={() => setActiveClassDetailId(null)}
          />
        );
      }
      switch (activeTab) {
        case 'teacher-overview':
          return <TeacherOverview onNavigate={(tab) => setActiveTab(tab)} />;
        case 'teacher-classes':
          return <ClassesList onSelectClass={(id) => setActiveClassDetailId(id)} initialTab="list" />;
        case 'teacher-classes-create':
          return <ClassesList onSelectClass={(id) => setActiveClassDetailId(id)} initialTab="create" />;
        case 'teacher-students':
          return <StudentsList />;
        case 'teacher-attendance':
          return <AttendanceView initialClassId="cls_10a1" />;
        case 'teacher-schedule':
          return <ScheduleView onGoToAttendance={() => setActiveTab('teacher-attendance')} />;
        case 'teacher-question-bank':
        case 'teacher-quizzes':
          return <QuestionBankView />;
        case 'teacher-assignments':
          return <AssignmentsView />;
        case 'teacher-auto-grading':
          return <AutoGradingView />;
        case 'teacher-digital-docs':
          return <DigitalDocsView />;
        case 'teacher-ai':
          return <AIAssistant />;
        case 'teacher-grades':
          return <GradebookView />;
        case 'teacher-behavior':
          return <ReportsView />;
        case 'teacher-tools-wheel':
          return <ClassroomTools initialTool="wheel" />;
        case 'teacher-tools-random':
          return <ClassroomTools initialTool="random" />;
        case 'teacher-tools-groups':
          return <ClassroomTools initialTool="groups" />;
        case 'teacher-tools-timer':
          return <ClassroomTools initialTool="timer" />;
        case 'teacher-tools-quiz':
          return <ClassroomTools initialTool="quiz" />;
        case 'teacher-announcements':
          return <AnnouncementsView />;
        case 'teacher-reports':
          return <ReportsView />;
        default:
          return <TeacherOverview onNavigate={(tab) => setActiveTab(tab)} />;
      }
    }

    // Role 2: STUDENT
    if (role === 'STUDENT') {
      return <StudentPortal />;
    }

    // Role 3: PARENT
    if (role === 'PARENT') {
      return <ParentPortal />;
    }

    // Role 4: ADMIN
    if (role === 'ADMIN') {
      return <AdminPortal />;
    }

    return <TeacherOverview onNavigate={(tab) => setActiveTab(tab)} />;
  };

  return (
    <div className="min-h-screen bg-[#050816] text-slate-100 flex flex-col relative selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Subtle neon edge line on the left requested by Section 9 */}
      <div className="edge-light-cyan" />

      {/* Cyberpunk digital grid & dark ambient lighting */}
      <div className="fixed inset-0 bg-digital-grid pointer-events-none opacity-40" />
      <div className="fixed top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-fuchsia-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* TopBar */}
      <TopBar
        onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        onGoToLogin={() => setCurrentPage('login')}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => {
            setActiveClassDetailId(null);
            setActiveTab(tabId);
          }}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onGoToLogin={() => setCurrentPage('login')}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 lg:pl-64 flex flex-col min-w-0">
          <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ToastProvider>
  );
}
