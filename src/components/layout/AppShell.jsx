import { useRef, useCallback, useEffect, useState } from 'react';
import useAppStore from '@/store/useAppStore';
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

export default function AppShell() {
  const currentPage = useAppStore(s => s.currentPage);
  const toastMessage = useAppStore(s => s.toastMessage);
  const toastVisible = useAppStore(s => s.toastVisible);
  const [modals, setModals] = useState({});
  const [modalData, setModalData] = useState({});
  const toggleRef = useRef(null);
  const scrollBtnProps = useRef(null);

  const openModal = useCallback((name, data) => {
    setModals(prev => ({ ...prev, [name]: true }));
    if (data !== undefined) setModalData(prev => ({ ...prev, [name]: data }));
  }, []);

  const closeModal = useCallback((name) => {
    setModals(prev => ({ ...prev, [name]: false }));
  }, []);

  useEffect(() => {
    const app = document.getElementById('app');
    if (app) {
      requestAnimationFrame(() => app.classList.add('visible'));
    }
  }, []);

  return (
    <div id="app">
      <HoneycombCanvas />
      <Sidebar onOpenModal={openModal} onToggleSidebar={toggleRef} />
      <div id="main-wrapper">
        <main id="main" className={currentPage !== 'chat' ? 'hidden' : ''}>
          <Topbar onOpenModal={openModal} onToggleSidebar={toggleRef} />
          <ChatArea onOpenModal={openModal} scrollBtnProps={scrollBtnProps} />
          <InputArea onOpenModal={openModal} scrollBtnProps={scrollBtnProps} />
        </main>
        <div id="agents-page" className={currentPage !== 'agents' ? 'hidden' : ''}>
          <AgentsPage onOpenModal={openModal} onToggleSidebar={toggleRef} />
        </div>
      </div>

      <SettingsDialog visible={!!modals.settings} onClose={() => closeModal('settings')} />
      <MemoryDialog visible={!!modals.memory} onClose={() => closeModal('memory')} />
      <ModelPickerDialog visible={!!modals.model} onClose={() => closeModal('model')} />
      <HelpDialog visible={!!modals.help} onClose={() => closeModal('help')} />
      <HtmlPreviewDialog visible={!!modals.htmlPreview} onClose={() => closeModal('htmlPreview')} data={modalData.htmlPreview} />
      <RenameDialog visible={!!modals.rename} onClose={() => closeModal('rename')} chatId={modalData.rename} />
      <ConfirmDeleteDialog visible={!!modals.confirmDelete} onClose={() => closeModal('confirmDelete')} chatId={modalData.confirmDelete} />
      <CreateAgentDialog visible={!!modals.createAgent} onClose={() => closeModal('createAgent')} />
      <CreateCategoryDialog visible={!!modals.createCategory} onClose={() => closeModal('createCategory')} />

      <div id="toast" className={toastVisible ? 'show' : ''}>{toastMessage}</div>
    </div>
  );
}
