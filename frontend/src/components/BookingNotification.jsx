import toast from 'react-hot-toast';

let audio = null;
let audioInitialized = false;

function initAudio() {
  if (!audioInitialized) {
    // Path to your custom sound file
    audio = new Audio('/sounds/notification.mp3'); 
    audio.volume = 0.5; // Volume adjust kar sakte ho (0.0 - 1.0)
    audioInitialized = true;
  }
}

// First user interaction pe audio initialize karo (autoplay policy)
if (typeof window !== 'undefined') {
  const events = ['click', 'touchstart', 'keydown'];
  const handler = () => {
    initAudio();
    events.forEach(e => window.removeEventListener(e, handler));
  };
  events.forEach(e => window.addEventListener(e, handler));
}

function playNotificationSound() {
  if (audio) {
    // Stop previous playback (if any) and play again
    audio.currentTime = 0;
    audio.play().catch(err => console.warn('Audio play failed:', err));
  }
}

export function showBookingNotification(message, description = '') {
  // Play custom sound
  playNotificationSound();

  // Show toast
  toast.custom((t) => (
    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            <span className="text-2xl">🔔</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => toast.dismiss(t.id)}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
        >
          Close
        </button>
      </div>
    </div>
  ), { duration: 5000 });
}