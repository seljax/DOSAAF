import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { DesignEditorProvider, useDesignEditor } from './context/DesignEditorContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { RulesAndSignsView } from './components/RulesAndSignsView';
import { TestsView } from './components/TestsView';
import { MaterialsView } from './components/MaterialsView';
import { StatisticsView } from './components/StatisticsView';
import { CompletedLessonsView } from './components/CompletedLessonsView';
import { ScheduleInfoView } from './components/ScheduleInfoView';
import { StudentProfileView } from './components/StudentProfileView';
import { ActivityLogsView } from './components/ActivityLogsView';
import { Footer } from './components/Footer';
import { DesignInspector } from './components/DesignInspector';
import { AuthModal } from './components/AuthModal';
import { StudentManagementModal } from './components/StudentManagementModal';
import { ShieldCheck, Car, Lock, AlertTriangle, Users } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>('rules');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<'student' | 'admin'>('student');
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const { currentUser, isAdmin, adminCredentials, groups, canAccessTab } = useApp();
  const { setActivePageKey } = useDesignEditor();

  // Sync active page with design editor
  useEffect(() => {
    setActivePageKey(activeTab);
  }, [activeTab, setActivePageKey]);

  // If current tab is restricted for student, automatically suggest switching to an allowed one
  const hasAccessToCurrentTab = canAccessTab(activeTab);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-7 pb-24 md:pb-12">
        {!hasAccessToCurrentTab ? (
          <div className="max-w-lg mx-auto my-12 bg-white p-8 rounded-3xl border border-neutral-200 shadow-sm text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 mx-auto bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Раздел временно недоступен</h2>
              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                Администратор автошколы ограничил доступ к этой вкладке для вашей учётной записи ({currentUser?.name || 'Курсант'}).
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setActiveTab('rules')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Перейти в Правила и знаки
              </button>
              {canAccessTab('tests') && (
                <button
                  onClick={() => setActiveTab('tests')}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Перейти в Тесты
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'rules' && <RulesAndSignsView />}
            {activeTab === 'tests' && <TestsView />}
            {activeTab === 'materials' && <MaterialsView />}
            {activeTab === 'stats' && <StatisticsView />}
            {activeTab === 'lessons' && <CompletedLessonsView />}
            {activeTab === 'schedule' && <ScheduleInfoView />}
            {activeTab === 'profile' && (
              <StudentProfileView
                onOpenAuth={(tab) => {
                  setAuthDefaultTab(tab || 'student');
                  setAuthModalOpen(true);
                }}
                onNavigateToTab={(tab) => setActiveTab(tab)}
                onOpenStudentModal={() => setStudentModalOpen(true)}
              />
            )}
            {activeTab === 'logs' && <ActivityLogsView />}
          </>
        )}
      </main>

      {/* Floating Design Inspector for Admin */}
      <DesignInspector />

      {/* Full Customizable Footer with Email, Phone, Theme Switcher & Admin Controls */}
      <Footer
        onOpenAuth={(tab) => {
          setAuthDefaultTab(tab);
          setAuthModalOpen(true);
        }}
        onOpenStudentModal={() => setStudentModalOpen(true)}
        onNavigateToTab={(tab) => setActiveTab(tab)}
      />

      {/* Mobile Bottom Thumb Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />

      {/* Admin Student Management Modal */}
      <StudentManagementModal
        isOpen={studentModalOpen}
        onClose={() => setStudentModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <DesignEditorProvider>
        <AppContent />
      </DesignEditorProvider>
    </AppProvider>
  );
}
