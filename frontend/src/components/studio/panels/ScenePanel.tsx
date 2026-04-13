import { Camera, Box, Sun } from 'lucide-react';

export const ScenePanel = () => (
  <ul className="space-y-1 text-sm text-white/70">
    <li className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-surface-2">
      <Camera className="h-3.5 w-3.5 text-white/40" />
      Camera
    </li>
    <li className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-surface-2">
      <Sun className="h-3.5 w-3.5 text-white/40" />
      Lighting
    </li>
    <li className="flex items-center gap-2 rounded-sm px-2 py-1 hover:bg-surface-2">
      <Box className="h-3.5 w-3.5 text-white/40" />
      Subject
    </li>
  </ul>
);
