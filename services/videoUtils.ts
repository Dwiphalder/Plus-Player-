
export const generateVideoThumbnail = (videoUrl: string): Promise<{ thumbnail: string, duration: number }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let resolved = false;

    const resolveData = (thumb: string, dur: number) => {
        if (resolved) return;
        resolved = true;
        resolve({ thumbnail: thumb, duration: dur || 0 });
        video.remove();
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 320; 
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolveData(dataUrl, video.duration);
        } else {
            resolveData('', video.duration);
        }
      } catch (e) {
        resolveData('', video.duration);
      }
    };
    
    const onLoadedMetadata = () => {
        if (video.duration === Infinity) {
             video.currentTime = 1;
        } else if (video.duration > 1) {
            video.currentTime = 1;
        } else {
            video.currentTime = 0;
        }
    }

    const onError = () => {
        resolveData('', 0);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    
    setTimeout(() => {
        resolveData('', 0);
    }, 4000);
  });
};
