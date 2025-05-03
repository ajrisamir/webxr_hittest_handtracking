const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');

function adjustVideoCanvasSize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    videoElement.width = width;
    videoElement.height = height;
    canvasElement.width = width;
    canvasElement.height = height;
}

window.addEventListener('resize', adjustVideoCanvasSize);
adjustVideoCanvasSize();

let previousLandmarks = null;

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
            drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });

            if (landmarks[8] && landmarks[4]) {
                // Mengubah selector untuk mendapatkan entity yang aktif
                if (currentEntity) {
                    const indexFinger = landmarks[8];
                    const thumb = landmarks[4];

                    const distance = Math.sqrt(
                        Math.pow(indexFinger.x - thumb.x, 2) + 
                        Math.pow(indexFinger.y - thumb.y, 2)
                    );
                    
                    // Menyesuaikan skala
                    const currentScale = currentEntity.getAttribute('scale');
                    const newScale = distance * 2;
                    currentEntity.setAttribute('scale', `${newScale} ${newScale} ${newScale}`);

                    // Menyesuaikan rotasi
                    const deltaX = thumb.x - indexFinger.x;
                    const deltaY = thumb.y - indexFinger.y;
                    const deltaZ = thumb.z - indexFinger.z;
                    const rotationX = Math.atan2(deltaY, deltaZ) * (180 / Math.PI);
                    const rotationY = Math.atan2(deltaX, deltaZ) * (180 / Math.PI);
                    
                    const currentRotation = currentEntity.getAttribute('rotation');
                    currentEntity.setAttribute('rotation', {
                        x: rotationX,
                        y: rotationY,
                        z: currentRotation.z
                    });
                }
            }
        }
    }
    canvasCtx.restore();
}

// Setup MediaPipe Hands dengan error handling
const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
}).catch(error => {
    console.error("Error initializing MediaPipe Hands:", error);
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

// Setup camera dengan error handling
try {
    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({ image: videoElement });
        },
        facingMode: "environment",
        width: 1280,
        height: 720
    });
    camera.start().catch(error => {
        console.error("Error starting camera:", error);
    });
} catch (error) {
    console.error("Error setting up camera:", error);
}

// Tambahkan event listener untuk debugging
videoElement.addEventListener('loadedmetadata', () => {
    console.log("Video stream started");
});

videoElement.addEventListener('error', (error) => {
    console.error("Video element error:", error);
});
