import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { RightPanel } from './RightPanel';
import { BottomNav } from './BottomNav';
import { ToastHost, useToast } from '../ui/Toast';
import { ListDialog } from '../../features/lists/ListDialog';
import {
  useInitDb,
  useCurrentUserId,
  useLiveTaskCounts,
  useLiveLists,
  useLiveTasks,
  useLiveNotifications,
} from '../../db/useDatabase';
import { createList, updateList, deleteList } from '../../db/repositories';
import { scheduler } from '../../features/notifications/scheduler';
import { useSession } from '../../features/auth/useSession';
import { syncEngine } from '../../features/sync/engine';

interface AppLayoutProps {
  onNewTask?: () => void;
  activeStatusTab?: 'all' | 'active' | 'completed';
  onStatusTabChange?: (tab: 'all' | 'active' | 'completed') => void;
  currentView?: 'cards' | 'list' | 'board' | 'calendar';
  onViewChange?: (view: 'cards' | 'list' | 'board' | 'calendar') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenTask?: (taskId: string) => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  onNewTask,
  activeStatusTab,
  onStatusTabChange,
  currentView,
  onViewChange,
  searchQuery,
  onSearchChange,
  onOpenTask,
}) => {
  const currentUserId = useCurrentUserId();
  useInitDb(currentUserId);
  const taskCounts = useLiveTaskCounts(currentUserId);
  const lists = useLiveLists(currentUserId);
  const tasks = useLiveTasks(currentUserId);
  const notifications = useLiveNotifications(currentUserId);
  const { show: showToast } = useToast();
  const { checkSession } = useSession();

  // Initialize session and sync engine
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Initialize background reminder scheduler with Web Locks tab-leader
  useEffect(() => {
    scheduler.init(currentUserId, {
      onShowToast: showToast,
    });
    return () => scheduler.destroy();
  }, [currentUserId, showToast]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [rightPanelSlideOverOpen, setRightPanelSlideOverOpen] = useState(false);

  // List dialog state
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [listToEdit, setListToEdit] = useState<{ id: string; name: string; color: string } | null>(
    null
  );

  const handleSaveList = async (data: { name: string; color: string }) => {
    if (listToEdit) {
      await updateList(listToEdit.id, data);
      showToast({ title: 'List updated', type: 'success' });
    } else {
      await createList(data);
      showToast({ title: 'List created', type: 'success' });
    }
  };

  const handleDeleteList = async (id: string) => {
    await deleteList(id);
    showToast({ title: 'List deleted', description: 'Tasks moved to No list.' });
  };

  const sidebarLists = lists.map((l) => ({
    id: l.id,
    name: l.name,
    color: l.color,
    count: taskCounts.lists[l.id] || 0,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-bg text-text">
      <Header
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        onOpenRightPanel={() => setRightPanelSlideOverOpen(true)}
        onNewTask={onNewTask}
        activeStatusTab={activeStatusTab}
        onStatusTabChange={onStatusTabChange}
        currentView={currentView}
        onViewChange={onViewChange}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        notifications={notifications}
        tasks={tasks}
        onOpenTask={onOpenTask}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          isOpenMobile={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          taskCounts={taskCounts}
          lists={sidebarLists}
          onAddList={() => {
            setListToEdit(null);
            setListDialogOpen(true);
          }}
          onEditList={(list) => {
            setListToEdit(list);
            setListDialogOpen(true);
          }}
        />

        <main className="flex-1 min-w-0 px-3 sm:px-6 py-6 pb-20 md:pb-6 overflow-x-hidden">
          <div className="max-w-[760px] mx-auto w-full">
            <React.Suspense
              fallback={<div className="p-8 text-center text-xs text-text-muted">Loading...</div>}
            >
              <Outlet />
            </React.Suspense>
          </div>
        </main>

        <RightPanel
          isOpenSlideOver={rightPanelSlideOverOpen}
          onCloseSlideOver={() => setRightPanelSlideOverOpen(false)}
        />
      </div>

      <BottomNav
        onOpenMenu={() => setMobileSidebarOpen(true)}
        onNewTask={() => onNewTask?.()}
        unreadAlertsCount={notifications.filter((n) => !n.readAt && !n.dismissedAt).length}
      />

      <ListDialog
        open={listDialogOpen}
        onOpenChange={setListDialogOpen}
        listToEdit={listToEdit}
        onSave={handleSaveList}
        onDelete={handleDeleteList}
      />

      <ToastHost />
    </div>
  );
};
