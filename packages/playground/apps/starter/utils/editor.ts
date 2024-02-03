import { __unstableSchemas } from '@blocksuite/blocks/models';
import { assertExists } from '@blocksuite/global/utils';
import type { EditorHost } from '@blocksuite/lit';
import { AffineEditorContainer, CopilotPanel } from '@blocksuite/presets';
import type { Workspace } from '@blocksuite/store';

import { CustomFramePanel } from '../../components/custom-frame-panel.js';
import { CustomOutlinePanel } from '../../components/custom-outline-panel.js';
import { DebugMenu } from '../../components/debug-menu.js';
import { LeftSidePanel } from '../../components/left-side-panel.js';
import { PagesPanel } from '../../components/pages-panel.js';
import { SidePanel } from '../../components/side-panel.js';

const params = new URLSearchParams(location.search);
const defaultMode =
  params.get('mode') === 'page'
    ? 'page'
    : !params.get('mode')
      ? 'page'
      : 'edgeless';

export function mountDefaultPageEditor(workspace: Workspace) {
  const page = workspace.pages.values().next().value;
  assertExists(page, 'Need to create a page first');

  assertExists(page.ready, 'Page is not ready');
  assertExists(page.root, 'Page root is not ready');

  const app = document.getElementById('app');
  if (!app) return;

  const editor = new AffineEditorContainer();
  editor.page = page;
  editor.slots.pageLinkClicked.on(({ pageId }) => {
    const target = workspace.getPage(pageId);
    if (!target) {
      throw new Error(`Failed to jump to page ${pageId}`);
    }
    editor.page = target;
  });

  app.append(editor);

  editor.updateComplete
    .then(() => {
      const debugMenu = new DebugMenu();
      const outlinePanel = new CustomOutlinePanel();
      const framePanel = new CustomFramePanel();
      const copilotPanelPanel = new CopilotPanel();
      const sidePanel = new SidePanel();
      const leftSidePanel = new LeftSidePanel();
      const pagesPanel = new PagesPanel();

      debugMenu.workspace = workspace;
      debugMenu.editor = editor;
      debugMenu.mode = defaultMode;
      debugMenu.outlinePanel = outlinePanel;
      debugMenu.framePanel = framePanel;
      debugMenu.copilotPanel = copilotPanelPanel;
      debugMenu.sidePanel = sidePanel;
      debugMenu.leftSidePanel = leftSidePanel;
      debugMenu.pagesPanel = pagesPanel;

      outlinePanel.editor = editor;
      copilotPanelPanel.editor = editor;
      framePanel.editor = editor;
      pagesPanel.editor = editor;

      document.body.appendChild(debugMenu);
      document.body.appendChild(outlinePanel);
      document.body.appendChild(sidePanel);
      document.body.appendChild(leftSidePanel);
      document.body.appendChild(framePanel);

      // debug info
      window.editor = editor;
      window.page = page;
      Object.defineProperty(globalThis, 'host', {
        get() {
          return document.querySelector<EditorHost>('editor-host');
        },
      });
      Object.defineProperty(globalThis, 'std', {
        get() {
          return document.querySelector<EditorHost>('editor-host')?.std;
        },
      });
    })
    .catch(console.error);

  return editor;
}