import { useEffect, useRef, useState } from 'react';
import { loadGLBAsPointCloud, type PointCloudData } from '@/utils/glbToPointCloud';

interface State {
  pointCloud: PointCloudData | null;
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, PointCloudData>();

export const useGlbPointCloud = (url: string | null, targetCount: number): State => {
  const [state, setState] = useState<State>({ pointCloud: null, loading: false, error: null });
  const reqRef = useRef(0);

  useEffect(() => {
    if (!url) {
      setState({ pointCloud: null, loading: false, error: null });
      return;
    }

    const cacheKey = `${url}#${targetCount}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      setState({ pointCloud: cached, loading: false, error: null });
      return;
    }

    const reqId = ++reqRef.current;
    setState((s) => ({ ...s, loading: true, error: null }));

    loadGLBAsPointCloud(url, targetCount)
      .then((data) => {
        if (reqRef.current !== reqId) return;
        cache.set(cacheKey, data);
        setState({ pointCloud: data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (reqRef.current !== reqId) return;
        setState({ pointCloud: null, loading: false, error: err.message });
      });
  }, [url, targetCount]);

  return state;
};
