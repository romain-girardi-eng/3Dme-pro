import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Loader2, AlertCircle } from 'lucide-react';

export interface MeshRendererProps {
  url: string;
  className?: string;
}

export const MeshRenderer = ({ url, className }: MeshRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setLoading(true);
    setError(null);

    let disposed = false;
    let raf = 0;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const hemi = new THREE.HemisphereLight(0xffffff, 0x101020, 0.6);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x8b5cf6, 1.2);
    rim.position.set(-4, 2, -3);
    scene.add(rim);

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.01, 200);
    camera.position.set(0, 0, 3);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 0.3;
    controls.maxDistance = 20;

    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        if (disposed) return;
        const model = gltf.scene;
        // Normalize: center and scale to fit a 2-unit bounding sphere
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const scale = 2 / maxDim;
        model.scale.setScalar(scale);
        scene.add(model);

        // Frame camera
        const fitDist = 2 / (2 * Math.tan((camera.fov * Math.PI) / 360));
        camera.position.set(fitDist * 1.4, fitDist * 0.6, fitDist * 1.8);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();

        setLoading(false);
      },
      undefined,
      (err) => {
        if (disposed) return;
        setError((err as Error).message || 'Failed to load mesh');
        setLoading(false);
      },
    );

    const tick = () => {
      if (disposed) return;
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
      controls.dispose();
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [url]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-2xs font-mono text-white/60">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading mesh…
        </div>
      )}
      {error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-2xs font-mono text-signal-danger">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}
    </div>
  );
};
