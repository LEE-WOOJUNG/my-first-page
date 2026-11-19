// ===== MP3 플레이어 =====
const bgm = document.getElementById('bgm');
const player = document.querySelector('.player');
const playBtn = player.querySelector('.play-btn');
const stopBtn = player.querySelector('.stop-btn');
const muteBtn = player.querySelector('.mute-btn');
const seek = player.querySelector('.seek');
const timeNow = player.querySelector('.time-now');
const timeTotal = player.querySelector('.time-total');
bgm.volume = 0.4;  // 너무 크지 않게 (0 ~ 1)

// 초를 "1:05" 같은 모양으로 바꿈
function formatTime(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return m + ':' + String(s).padStart(2, '0');
}

// 재생 / 일시정지 상태에 맞춰 가운데 버튼 모양을 바꿈
function updatePlayBtn() {
  const playing = !bgm.paused;
  playBtn.textContent = playing ? '⏸' : '▶';
  playBtn.setAttribute('aria-label', playing ? '일시정지' : '재생');
  player.classList.toggle('is-playing', playing);
}
bgm.addEventListener('play', updatePlayBtn);
bgm.addEventListener('pause', updatePlayBtn);

// 곡 길이를 알게 되면 전체 시간 표시
bgm.addEventListener('loadedmetadata', function () {
  timeTotal.textContent = formatTime(bgm.duration);
});

// 재생되는 동안 진행 막대와 현재 시간을 계속 갱신
bgm.addEventListener('timeupdate', function () {
  if (bgm.duration) {
    seek.value = (bgm.currentTime / bgm.duration) * 100;
  }
  timeNow.textContent = formatTime(bgm.currentTime);
});

// ▶ / ⏸ : 재생과 일시정지
playBtn.addEventListener('click', function () {
  if (bgm.paused) {
    bgm.play();
  } else {
    bgm.pause();
  }
});

// ⏹ : 정지 (멈추고 처음으로 되감기)
stopBtn.addEventListener('click', function () {
  bgm.pause();
  bgm.currentTime = 0;
});

// 🔊 / 🔇 : 소리 켜기와 끄기
muteBtn.addEventListener('click', function () {
  bgm.muted = !bgm.muted;
  muteBtn.textContent = bgm.muted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-label', bgm.muted ? '소리 켜기' : '소리 끄기');
  muteBtn.setAttribute('aria-pressed', bgm.muted);
});

// 진행 막대를 움직이면 그 위치로 이동
seek.addEventListener('input', function () {
  if (bgm.duration) {
    bgm.currentTime = (seek.value / 100) * bgm.duration;
  }
});

// 브라우저는 소리가 나는 자동재생을 막아요.
// 그래서 방문자가 페이지를 처음 클릭하거나 누를 때 음악을 시작합니다.
// (플레이어를 직접 누른 경우는 그 버튼의 동작을 따릅니다.)
function startOnFirstTouch(event) {
  if (!player.contains(event.target)) {
    bgm.play().catch(function () {});
  }
}
document.addEventListener('pointerdown', startOnFirstTouch, { once: true });

// 모든 글로우 버튼에 '자석' 효과와 '물결' 효과를 붙입니다.
const strength = 10; // 마우스 쪽으로 끌려가는 최대 거리(px)

document.querySelectorAll('.glow-btn').forEach(function (btn) {
  // 마우스가 버튼 위에서 움직일 때
  btn.addEventListener('pointermove', function (event) {
    const box = btn.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width;  // 0 ~ 1
    const y = (event.clientY - box.top) / box.height;  // 0 ~ 1
    btn.style.transform = 'translate(' + (x - 0.5) * strength + 'px, ' + (y - 0.5) * strength + 'px)';
    btn.style.setProperty('--mx', x * 100 + '%');
    btn.style.setProperty('--my', y * 100 + '%');
  });

  // 마우스가 버튼을 떠나면 제자리로
  btn.addEventListener('pointerleave', function () {
    btn.style.transform = '';
  });

  // 클릭하면 누른 자리에서 물결이 퍼짐
  btn.addEventListener('click', function (event) {
    const inner = btn.querySelector('.inner');
    const box = inner.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.left = (event.clientX - box.left) + 'px';
    ripple.style.top = (event.clientY - box.top) + 'px';
    inner.prepend(ripple);
    setTimeout(function () { ripple.remove(); }, 700);
  });
});

// ===== 홀로그램 틸트 카드 =====
const holo = document.querySelector('.holo');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointer = { x: 0, y: 0, active: false };

// 스프링: 목표 쪽으로 당기고(stiffness) 속도를 줄여서(damping)
// 살짝 지나쳤다가 돌아오는 자연스러운 움직임을 만듭니다.
const tiltX = { value: 0, speed: 0 };
const tiltY = { value: 0, speed: 0 };
function spring(s, target) {
  s.speed = (s.speed + (target - s.value) * 0.08) * 0.8;
  s.value += s.speed;
}

// 마우스(또는 손가락) 위치를 -1 ~ 1 값으로 바꿉니다.
holo.addEventListener('pointermove', function (event) {
  const box = holo.getBoundingClientRect();
  pointer.x = Math.max(-1, Math.min(1, (event.clientX - box.left - box.width / 2) / (box.width / 2)));
  pointer.y = Math.max(-1, Math.min(1, (event.clientY - box.top - box.height / 2) / (box.height / 2)));
  pointer.active = true;
});
holo.addEventListener('pointerleave', function () {
  pointer.active = false;
});

// 움직임 줄이기 설정이면 카드를 가만히 둡니다.
if (!reduceMotion) {
  const start = performance.now();
  function loop(now) {
    const t = (now - start) / 1000;
    // 마우스가 없을 때는 천천히 흔들리며 반짝입니다.
    const targetX = pointer.active ? pointer.x : Math.sin(t * 0.9) * 0.6;
    const targetY = pointer.active ? pointer.y : Math.cos(t * 0.65) * 0.38;
    spring(tiltX, targetX);
    spring(tiltY, targetY);
    holo.style.setProperty('--tx', tiltX.value.toFixed(4));
    holo.style.setProperty('--ty', tiltY.value.toFixed(4));
    holo.style.setProperty('--hyp', Math.min(1, Math.hypot(tiltX.value, tiltY.value)).toFixed(4));
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
