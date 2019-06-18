const KEYPOINT_THRESHOLD = 0.05;
const X_LEFT_THRESHOLD = 200;
const X_RIGHT_THRESHOLD = 450;

let currentLeftActive = false;
let lastLeftActive = false;
let currentRightActive = false;
let lastRightActive = false;

let DEBUG_MODE = false;

window.addEventListener('DOMContentLoaded', (event) => {
  const video = document.getElementById('video');
  const canvas = document.getElementById('canvas');
  const leftWristLabel = document.getElementById('leftWrist');
  const rightWristLabel = document.getElementById('rightWrist');
  const startButton = document.getElementById('start');
  const ctx = canvas.getContext('2d');

  const mediaConstraints = {
    'audio': false,
    'video': { facingMode: 'user' }
  };

  startButton.addEventListener('click', onStart);

  function onStart() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("no camera access");
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(mediaConstraints).then((stream) => {
        video.srcObject = stream;
        video.play().then(() => {
          posenet.load({
            architecture: 'MobileNetV1',
            multiplier: 0.50
          }).then(function(net) {
            async function poseDetectionFrame() {
              const poses = await net.estimatePoses(video, {
                flipHorizontal: true,
                decodingMethod: 'single-person'
              });

              ctx.save();
              ctx.scale(-1, 1);
              ctx.translate(-640, 0);
              ctx.drawImage(video, 0, 0, 640, 480);
              ctx.restore();

              poses.forEach(function(pose) {
                pose.keypoints.forEach(function(keypoint) {
                  if (keypoint.part === "leftWrist") {
                    if (keypoint.score > KEYPOINT_THRESHOLD) {
                      ctx.beginPath();
                      ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
                      ctx.fillStyle = 'aqua';
                      // ctx.fillText((keypoint.position.x + ", " + keypoint.position.y), keypoint.position.x, keypoint.position.y);
                      ctx.fill();

                      if (keypoint.position.x < X_LEFT_THRESHOLD) {
                        currentLeftActive = true;
                      } else {
                        currentLeftActive = false;
                      }
                    } else {
                      currentLeftActive = false;
                    }

                    if (DEBUG_MODE) {
                      leftWristLabel.textContent = keypoint.position.x + ", " + keypoint.position.y + " | current: " + currentLeftActive + " , last: " + lastLeftActive;
                    }

                    if (lastLeftActive !== currentLeftActive) {
                      fetch('/api/left', { method: 'POST', headers: { 'Content-Type': 'application/json' }}).then((res) => {
                        lastLeftActive = currentLeftActive;
                        leftWristLabel.classList.toggle("active");
                      }).catch((e) => { console.log(e) });
                    }
                  }

                  if (keypoint.part === "rightWrist") {
                    if (keypoint.score > KEYPOINT_THRESHOLD) {
                      ctx.beginPath();
                      ctx.arc(keypoint.position.x, keypoint.position.y, 10, 0, 2 * Math.PI);
                      ctx.fillStyle = 'aqua';
                      // ctx.fillText((keypoint.position.x + ", " + keypoint.position.y), keypoint.position.x, keypoint.position.y);
                      ctx.fill();

                      if (keypoint.position.x > X_RIGHT_THRESHOLD) {
                        currentRightActive = true;
                      } else {
                        currentRightActive = false;
                      }
                    } else {
                      currentRightActive = false;
                    }

                    if (DEBUG_MODE) {
                      rightWristLabel.textContent = keypoint.position.x + ", " + keypoint.position.y + " | current: " + currentRightActive + " , last: " + lastRightActive;
                    }

                    if (lastRightActive !== currentRightActive) {
                      fetch('/api/right', { method: 'POST', headers: { 'Content-Type': 'application/json' }}).then((res) => {
                        lastRightActive = currentRightActive;
                        rightWristLabel.classList.toggle("active");
                      }).catch((e) => { console.log(e) });
                    }
                  }
                });
              });

              requestAnimationFrame(poseDetectionFrame);
            }

            poseDetectionFrame();
          });
        }).catch((e) => {
          console.log(e);
        });
      });
    }
  };
});
