import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { LookPanel } from './panels/LookPanel';
import { MotionPanel } from './panels/MotionPanel';
import { MousePanel } from './panels/MousePanel';

export const RightRail = () => (
  <aside className="hidden md:flex w-[300px] shrink-0 flex-col border-l border-border-subtle bg-surface-1 backdrop-blur-md">
    <Tabs defaultValue="look" className="flex h-full flex-col">
      <TabsList className="m-2">
        <TabsTrigger value="look">Look</TabsTrigger>
        <TabsTrigger value="motion">Motion</TabsTrigger>
        <TabsTrigger value="mouse">Mouse</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto p-3">
        <TabsContent value="look">
          <LookPanel />
        </TabsContent>
        <TabsContent value="motion">
          <MotionPanel />
        </TabsContent>
        <TabsContent value="mouse">
          <MousePanel />
        </TabsContent>
      </div>
    </Tabs>
  </aside>
);
