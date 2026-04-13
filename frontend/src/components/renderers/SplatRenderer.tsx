import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Spark is imported dynamically to avoid bundling when splat mode is unused.
export interface SplatRendererProps {
  url: string;
  className?: string;
}

export const SplatRenderer = ({ url, className }: SplatRendererProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let renderer: THREE.WebGLRenderer | undefined;
    let raf = 0;
    let handleResize: (() => void) | undefined;

    const init = async () => {
      let SparkRenderer: unknown;
      let SplatMesh: unknown;
      try {
        const spark = (await import('@sparkjsdev/spark')) as Record<string, unknown>;
        SparkRenderer = spark.SparkRenderer;
        SplatMesh = spark.SplatMesh;
      } catch (err) {
        console.warn('[3Dme] Spark failed to load — splat mode unavailable', err);
        return;
      }
      if (disposed || !SparkRenderer || !SplatMesh) return;

      const { clientWidth: w, clientHeight: h } = container;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 100);
      camera.position.set(0, 0, 4);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
      renderer.setSize(w, h);
      container.appendChild(renderer.domElement);

      try {
        const sparkCtor = SparkRenderer as new (args: { renderer: THREE.WebGLRenderer }) => THREE.Object3D;
        const sparkInstance = new sparkCtor({ renderer });
        scene.add(sparkInstance);

        const meshCtor = SplatMesh as new (args: { url: string }) => THREE.Object3D;
        const mesh = new meshCtor({ url });
        scene.add(mesh);

        const tick = () => {
          if (disposed || !renderer) return;
          mesh.rotation.y += 0.002;
          renderer.render(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        console.warn('[3Dme] Spark scene setup failed', err);
      }

      handleResize = () => {
        if (!renderer) return;
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener('resize', handleResize);
    };

    void init();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (handleResize) window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [url]);

  return <div ref={containerRef} className={className} />;
};
