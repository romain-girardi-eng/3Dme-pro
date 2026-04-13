import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { ScenePanel } from './panels/ScenePanel';
import { LibraryPanel } from './panels/LibraryPanel';
import { AIPanel } from './panels/AIPanel';

export const LeftRail = () => (
  <aside className="hidden md:flex w-[280px] shrink-0 flex-col border-r border-border-subtle bg-surface-1 backdrop-blur-md">
    <Tabs defaultValue="ai" className="flex h-full flex-col">
      <TabsList className="m-2">
        <TabsTrigger value="scene">Scene</TabsTrigger>
        <TabsTrigger value="library">Library</TabsTrigger>
        <TabsTrigger value="ai">AI</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto p-3">
        <TabsContent value="scene">
          <ScenePanel />
        </TabsContent>
        <TabsContent value="library">
          <LibraryPanel />
        </TabsContent>
        <TabsContent value="ai">
          <AIPanel />
        </TabsContent>
      </div>
    </Tabs>
  </aside>
);
