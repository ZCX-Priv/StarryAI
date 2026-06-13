import { useRef, useCallback, useEffect, useState } from 'react';
import { useUiStore } from '@/status';
import { Toaster } from 'sonner';
import useTheme from '@/hooks/useTheme';
import HoneycombCanvas from './HoneycombCanvas';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ChatArea from '@/components/chat/ChatArea';
import InputArea from '@/components/chat/InputArea';
import AgentsPage from '@/components/agents/AgentsPage';
import SettingsDialog from '@/components/modals/SettingsDialog';
import MemoryDialog from '@/components/modals/MemoryDialog';
import ModelPickerDialog from '@/components/modals/ModelPickerDialog';
import HelpDialog from '@/components/modals/HelpDialog';
import HtmlPreviewDialog from '@/components/modals/HtmlPreviewDialog';
import RenameDialog from '@/components/modals/RenameDialog';
import ConfirmDeleteDialog from '@/components/modals/ConfirmDeleteDialog';
import CreateAgentDialog from '@/components/agents/CreateAgentDialog';
import CreateCategoryDialog from '@/components/agents/CreateCategoryDialog';

interface ScrollBtnState {
  showScrollBtn: boolean;
  scrollToBottom: (force?: boolean) => void;
}

interface ModalState {
  [key: string]: boolean;
}

interface ModalData {
  [key: string]: unknown;
}

interface HtmlPreviewData {
  code?: string;
  lang?: string;
}

export default function AppShell() {
  const currentPage = useUiStore(s => s.currentPage);
  const { isDark } = useTheme();
  const [modals, setModals] = useState<ModalState>({});
  const [modalData, setModalData] = useState<ModalData>({});
  const toggleRef = useRef<(() => void) | null>(null);
  const scrollBtnProps = useRef<ScrollBtnState | null>(null);

  const openModal = useCallback((name: string, data?: unknown) => {
    setModals(prev => ({ ...prev, [name]: true }));
    if (data !== undefined) setModalData(prev => ({ ...prev, [name]: data }));
  }, []);

  const closeModal = useCallback((name: string) => {
    setModals(prev => ({ ...prev, [name]: false }));
  }, []);

  useEffect(() => {
    const app = document.getElementById('app');
    if (app) {
      requestAnimationFrame(() => app.classList.add('visible'));
    }
  }, []);

  return (
    <div id="app" spellCheck={false}>
      <HoneycombCanvas />
      <Sidebar onOpenModal={openModal} onToggleSidebar={toggleRef} />
      <div id="main-wrapper">
        <main id="main" className={currentPage !== 'chat' ? 'hidden' : ''}>
          <Topbar onOpenModal={openModal} onToggleSidebar={toggleRef} />
          <ChatArea onOpenModal={openModal as () => void} scrollBtnProps={scrollBtnProps} />
          <InputArea onOpenModal={openModal as () => void} scrollBtnProps={scrollBtnProps} />
        </main>
        <div id="agents-page" className={currentPage !== 'agents' ? 'hidden' : ''}>
          <AgentsPage onOpenModal={openModal} onToggleSidebar={toggleRef} />
        </div>
      </div>

      <SettingsDialog visible={!!modals.settings} onClose={() => closeModal('settings')} />
      <MemoryDialog visible={!!modals.memory} onClose={() => closeModal('memory')} />
      <ModelPickerDialog visible={!!modals.model} onClose={() => closeModal('model')} />
      <HelpDialog visible={!!modals.help} onClose={() => closeModal('help')} />
      <HtmlPreviewDialog visible={!!modals.htmlPreview} onClose={() => closeModal('htmlPreview')} data={modalData.htmlPreview as HtmlPreviewData | undefined} />
      <RenameDialog visible={!!modals.rename} onClose={() => closeModal('rename')} chatId={modalData.rename as string | undefined} />
      <ConfirmDeleteDialog visible={!!modals.confirmDelete} onClose={() => closeModal('confirmDelete')} chatId={modalData.confirmDelete as string | undefined} />
      <CreateAgentDialog visible={!!modals.createAgent} onClose={() => closeModal('createAgent')} />
      <CreateCategoryDialog visible={!!modals.createCategory} onClose={() => closeModal('createCategory')} />

      <Toaster position="top-center" richColors closeButton duration={3000} theme={isDark ? 'dark' : 'light'} />
    </div>
  );
}
