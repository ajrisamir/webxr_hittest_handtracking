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
                const currentEntity = document.querySelector('a-scene').querySelector('[gltf-model]');
                if (currentEntity) {
                    const indexFinger = landmarks[8];
                    const thumb = landmarks[4];

                    // Calculate scale based on thumb-index distance
                    const distance = Math.sqrt(
                        Math.pow(indexFinger.x - thumb.x, 2) + 
                        Math.pow(indexFinger.y - thumb.y, 2)
                    );
                    const scale = distance * 5;
                    currentEntity.setAttribute('scale', `${scale} ${scale} ${scale}`);

                    // Calculate rotation
                    const deltaX = thumb.x - indexFinger.x;
                    const deltaY = thumb.y - indexFinger.y;
                    const deltaZ = thumb.z - indexFinger.z;
                    const rotationX = Math.atan2(deltaY, deltaZ) * (180 / Math.PI);
                    const rotationY = Math.atan2(deltaX, deltaZ) * (180 / Math.PI);
                    currentEntity.setAttribute('rotation', `${rotationX} ${rotationY} 0`);
                }
            }
        }
    }
    canvasCtx.restore();
}

const hands = new Hands({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    facingMode: "environment"
});

camera.start();