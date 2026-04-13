import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { ParticlesPanel } from './panels/ParticlesPanel';
import { MaterialPanel } from './panels/MaterialPanel';
import { PhysicsPanel } from './panels/PhysicsPanel';
import { PostPanel } from './panels/PostPanel';
import { AnimationPanel } from './panels/AnimationPanel';
import { AudioPanel } from './panels/AudioPanel';

export const RightRail = () => (
  <aside className="hidden md:flex w-[320px] shrink-0 flex-col border-l border-border-subtle bg-surface-1 backdrop-blur-md">
    <Tabs defaultValue="particles" className="flex h-full flex-col">
      <TabsList className="m-2">
        <TabsTrigger value="particles">Particles</TabsTrigger>
        <TabsTrigger value="material">Material</TabsTrigger>
        <TabsTrigger value="physics">Physics</TabsTrigger>
        <TabsTrigger value="post">Post</TabsTrigger>
        <TabsTrigger value="anim">Anim</TabsTrigger>
        <TabsTrigger value="audio">Audio</TabsTrigger>
      </TabsList>
      <div className="flex-1 overflow-y-auto p-3">
        <TabsContent value="particles">
          <ParticlesPanel />
        </TabsContent>
        <TabsContent value="material">
          <MaterialPanel />
        </TabsContent>
        <TabsContent value="physics">
          <PhysicsPanel />
        </TabsContent>
        <TabsContent value="post">
          <PostPanel />
        </TabsContent>
        <TabsContent value="anim">
          <AnimationPanel />
        </TabsContent>
        <TabsContent value="audio">
          <AudioPanel />
        </TabsContent>
      </div>
    </Tabs>
  </aside>
);
