export function extractYouTubeVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/,
        /youtube\.com\/v\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

export function getYouTubeDuration(videoId: string): Promise<number> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined' || !window.YT) {
            reject(new Error('YouTube IFrame API not loaded'));
            return;
        }

        const tempDiv = document.createElement('div');
        tempDiv.style.display = 'none';
        document.body.appendChild(tempDiv);

        new window.YT.Player(tempDiv, {
            videoId,
            events: {
                onReady: (event: any) => {
                    const duration = event.target.getDuration();
                    event.target.destroy();
                    document.body.removeChild(tempDiv);
                    resolve(duration);
                },
                onError: () => {
                    document.body.removeChild(tempDiv);
                    reject(new Error('Failed to load YouTube video'));
                },
            },
        });
    });
}

export function loadYouTubeAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.YT && window.YT.Player) {
            resolve();
            return;
        }

        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (existingScript) {
            (window as any).onYouTubeIframeAPIReady = () => resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onerror = () => reject(new Error('Failed to load YouTube API'));

        (window as any).onYouTubeIframeAPIReady = () => resolve();

        document.body.appendChild(script);
    });
}

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}
