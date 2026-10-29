import { useLoadingStore } from '@/store/useLoadingStore';
import LoadingScreen from './LoadingScreen';

export default function GlobalLoadingOverlay() {
  const isLoading = useLoadingStore((state) => state.isLoading);
  const title = useLoadingStore((state) => state.title);
  const subtitle = useLoadingStore((state) => state.subtitle);
  const progress = useLoadingStore((state) => state.progress);

  if (!isLoading) return null;

  return (
    <LoadingScreen
      title={title}
      subtitle={subtitle}
      progress={progress}
      fullscreen={true}
    />
  );
}
