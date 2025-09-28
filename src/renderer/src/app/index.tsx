import { HomePage } from '../pages/home'
import { CodeEditorPage } from '../pages/code-editor'
import { CodeAnalysisPage } from '../pages/code-analysis'
import { DocsPage } from '../pages/docs'
import { LogsPage } from '../pages/logs'
import { ModalProvider } from '../shared/ui/modal'
import { AppLayout } from './ui/AppLayout'
import { SettingsPage } from '../pages/settings'

function App(): React.JSX.Element {
  return (
    <ModalProvider>
      <AppLayout
        Home={HomePage}
        Editor={CodeEditorPage}
        Analysis={CodeAnalysisPage}
        Docs={DocsPage}
        Logs={LogsPage}
        Settings={SettingsPage}
      />
    </ModalProvider>
  )
}

export default App
