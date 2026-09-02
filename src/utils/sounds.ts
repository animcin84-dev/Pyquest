

const sounds = {
  success: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  levelUp: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3',
  message: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  buy: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',
  typing: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'
};

let isMuted = localStorage.getItem('pyquest_muted') === 'true';
const audioCache: Record<string, HTMLAudioElement> = {};


Object.entries(sounds).forEach(([key, url]) => {
  const audio = new Audio(url);
  audio.preload = 'auto';
  audio.volume = 0.3;
  audioCache[key] = audio;
});

export const toggleMute = () => {
  isMuted = !isMuted;
  localStorage.setItem('pyquest_muted', String(isMuted));

  if (isMuted) {
    Object.values(audioCache).forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  }
  return isMuted;
};

export const getIsMuted = () => isMuted;

export const playSound = (type: keyof typeof sounds) => {
  if (isMuted) return;

  try {
    const audio = audioCache[type];
    if (audio) {
      
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = 0.3;
      clone.play().catch(e => {
        
      });
    }
  } catch (e) {
    console.error('Sound error:', e);
  }
};
