import * as THREE from "three";
import { createPhysicsWorld, stepPhysics } from "./physics.js";
import { createCarBody, driveCar, applySurfaceDriveAssist } from "./car.js";
import { createBallBody } from "./ball.js";
import { getGameMode, isGoalPosition } from "./gameModes.js";

async function initGame() {
const $ = (id) => document.getElementById(id);
const CONFIG = { matchSeconds: 180, arenaX: 18, arenaZ: 30, goalHalfWidth: 5, goalHeight: 4.5 };

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x071322);
scene.fog = new THREE.Fog(0x071322, 55, 120);

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.1, 250);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xa8dcff, 0x142338, 2));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(-18, 35, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const material = (color, emissive = 0x000000, metalness = 0.2) =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.55, metalness, roughness: 0.48 });

function addBox(x, y, z, sx, sy, sz, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), material(color, options.emissive ?? 0));
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function makeArena() {
  addBox(0, -0.5, 0, 36, 1, 60, 0x145b48);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xe9f7ff });
  const drawLine = (points) => scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x, 0.025, z))),
    lineMat
  ));
  drawLine([[-18,-30],[18,-30],[18,30],[-18,30],[-18,-30]]);
  drawLine([[-18,0],[18,0]]);
  const ring = new THREE.Mesh(new THREE.RingGeometry(5.8, 6, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  scene.add(ring);

  // Césped con franjas alternas y áreas de portería.
  for (let i = 0; i < 10; i += 1) {
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 6),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0x1a6a56 : 0x1d765d, side: THREE.DoubleSide })
    );
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(0, 0.012, -27 + i * 6);
    scene.add(stripe);
  }

  const fieldMark = new THREE.LineBasicMaterial({ color: 0xd9f8ff, transparent: true, opacity: 0.9 });
  const mark = (points, y = 0.045) => scene.add(new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points.map(([x, z]) => new THREE.Vector3(x, y, z))),
    fieldMark
  ));
  for (const sign of [-1, 1]) {
    const z = sign * 22;
    mark([[-9,z], [9,z], [9,sign * 30], [-9,sign * 30], [-9,z]]);
    mark([[-5,z], [5,z], [5,sign * 30], [-5,sign * 30], [-5,z]]);
    mark([[-7,z], [7,z]]);
  }

  // Bordes luminosos y paneles de estadio.
  for (const sign of [-1, 1]) {
    addBox(sign * 17.72, 0.45, 0, 0.18, 0.9, 59, 0x09263b);
    addBox(sign * 17.58, 0.9, 0, 0.12, 0.12, 59, 0x19cfff, { emissive: 0x087ba8 });
    for (let i = 0; i < 14; i += 1) {
      const panel = addBox(sign * 17.25, 2.1, -27 + i * 4, 0.22, 1.6, 3.35, i % 2 ? 0x123b58 : 0x174966);
      panel.material.emissive = new THREE.Color(i % 2 ? 0x03101c : 0x062033);
    }
  }

  // Redes de las porterías, dibujadas como malla fina.
  for (const sign of [-1, 1]) {
    const netMat = new THREE.LineBasicMaterial({ color: sign < 0 ? 0x24d9ff : 0xffa34f, transparent: true, opacity: 0.42 });
    const vertices = [];
    for (let x = -5; x <= 5.01; x += 1) {
      vertices.push(new THREE.Vector3(x, 0.2, sign * 29.25), new THREE.Vector3(x, 4.3, sign * 29.25));
    }
    for (let y = 0.5; y <= 4.01; y += 0.7) {
      vertices.push(new THREE.Vector3(-5, y, sign * 29.25), new THREE.Vector3(5, y, sign * 29.25));
    }
    scene.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(vertices), netMat));
    const goalGlow = new THREE.PointLight(sign < 0 ? 0x12cfff : 0xff842c, 38, 17);
    goalGlow.position.set(0, 4.5, sign * 27.8);
    scene.add(goalGlow);
  }

  // Gradas compactas, focos y paneles de ambiente.
  for (const sign of [-1, 1]) {
    for (let row = 0; row < 3; row += 1) {
      const stand = addBox(sign * (22 + row * 1.25), 1.5 + row * 1.05, 0, 1.8, 0.7, 55, row % 2 ? 0x18334d : 0x102a42);
      stand.material.roughness = 0.82;
    }
    for (const z of [-23, -8, 8, 23]) {
      const lamp = new THREE.PointLight(0x68dfff, 22, 20);
      lamp.position.set(sign * 15.8, 10.5, z);
      scene.add(lamp);
      addBox(sign * 16.4, 10.5, z, 0.5, 0.18, 2.2, 0xc9f5ff, { emissive: 0x65cfff });
    }
  }

  // Paredes laterales y fondos divididos para dejar libres las porterías.
  addBox(0, 14, 0, 36, 0.5, 60, 0x0b1b2b);
  addBox(-18.5, 4, 0, 1, 8, 62, 0x153d59);
  addBox(18.5, 4, 0, 1, 8, 62, 0x153d59);
  for (const z of [-30.5, 30.5]) {
    addBox(-11.5, 4, z, 13, 8, 1, 0x153d59);
    addBox(11.5, 4, z, 13, 8, 1, 0x153d59);
    addBox(0, 6.5, z, 10, 3, 1, 0x153d59);
  }

  for (const [z, color] of [[-29.6, 0x12cfff], [29.6, 0xff842c]]) {
    addBox(-5, 2.25, z, 0.35, 4.5, 0.35, color, { emissive: color });
    addBox(5, 2.25, z, 0.35, 4.5, 0.35, color, { emissive: color });
    addBox(0, 4.5, z, 10.35, 0.35, 0.35, color, { emissive: color });
  }
  for (let i = 0; i < 12; i += 1) {
    for (const side of [-1, 1]) addBox(side * 23, 6, (i - 5.5) * 9, 0.8, 12, 0.8, 0x17324c);
  }
}

function createCarVisual(bodyColor = 0x06aaff, glowColor = 0x023b72) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 3.6), material(bodyColor, glowColor, 0.45));
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.55), material(0x182b42, 0x071a2d));
  cabin.position.set(0, 0.72, 0.1);
  group.add(cabin);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 0.08), material(0x52dfff, 0x1177aa));
  glass.position.set(0, 0.72, -0.72);
  group.add(glass);

  const boostFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.34, 1.25, 16),
    new THREE.MeshBasicMaterial({ color: 0x35dfff, transparent: true, opacity: 0.9 })
  );
  boostFlame.rotation.x = Math.PI / 2;
  boostFlame.position.set(0, 0.05, 2.15);
  boostFlame.visible = false;
  group.add(boostFlame);

  const wheels = [];
  for (const x of [-1.05, 1.05]) {
    for (const z of [-1.15, 1.15]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.3, 16), material(0x11151d));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, -0.42, z);
      group.add(wheel);
      wheels.push(wheel);
    }
  }
  scene.add(group);
  return { group, wheels, boostFlame };
}

function createBallVisual() {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1.5, 32, 32),
    new THREE.MeshStandardMaterial({ color: 0xf6fbff, metalness: 0.2, roughness: 0.28, emissive: 0x244466, emissiveIntensity: 0.35 })
  );
  mesh.castShadow = true;
  scene.add(mesh);
  return mesh;
}

const { RAPIER, world } = await createPhysicsWorld();
makeArena();

// Physical arena boundaries.
function fixedBox(x, y, z, hx, hy, hz) {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z));
  world.createCollider(RAPIER.ColliderDesc.cuboid(hx, hy, hz).setFriction(0.9).setRestitution(0.35), body);
}
fixedBox(-18.5, 4, 0, 0.5, 4, 31);
fixedBox(18.5, 4, 0, 0.5, 4, 31);
// Techo físico para permitir conducción invertida en la parte superior.
fixedBox(0, 14, 0, 18, 0.5, 30);
for (const z of [-30.5, 30.5]) {
  fixedBox(-11.5, 4, z, 6.5, 4, 0.5);
  fixedBox(11.5, 4, z, 6.5, 4, 0.5);
  fixedBox(0, 6.5, z, 5, 1.5, 0.5);
  fixedBox(-5, 2.25, z, 0.18, 2.25, 0.18);
  fixedBox(5, 2.25, z, 0.18, 2.25, 0.18);
  fixedBox(0, 4.5, z, 5, 0.18, 0.18);
}

const carBody = createCarBody(RAPIER, world, { x: 0, y: 1.1, z: 15 });
const carVisual = createCarVisual();
const rivalBody = createCarBody(RAPIER, world, { x: 0, y: 1.1, z: -15 });
const rivalVisual = createCarVisual(0xff8c32, 0x7a2600);
const ballBody = createBallBody(RAPIER, world, { x: 0, y: 2, z: 0 });
const ballVisual = createBallVisual();

const keys = new Set();
let running = false;
let paused = false;
let gameMode = "match";
let modeSettings = getGameMode(gameMode);
let remaining = modeSettings.duration;
let blueScore = 0;
let orangeScore = 0;
let boost = 100;
let jumpQueued = false;
let jumpCount = 0;
let gamepadJumpWasDown = false;
let boostActive = false;
let cameraMode = "car";
let kickoffCountdown = 0;
let lastGoalAt = -10;
let lastFrame = performance.now();

function setMessage(value) { $("message").textContent = value; }
function updateHud() {
  $("blueScore").textContent = String(blueScore);
  $("orangeScore").textContent = String(orangeScore);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  $("timer").textContent = !modeSettings.hasTimer ? "PRÁCTICA" : String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  $("boost").style.width = boost + "%";
}

function configureModeActors() {
  const training = !modeSettings.hasRival;
  rivalVisual.group.visible = !training;
  if (training) {
    rivalBody.setTranslation({ x: 0, y: -30, z: 0 }, true);
    rivalBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rivalBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  }
}

function resetBall() {
  ballBody.setTranslation({ x: 0, y: 2, z: 0 }, true);
  ballBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  ballBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  lastGoalAt = performance.now() / 1000;
  setMessage("PELOTA REINICIADA");
}

function resetBodies() {
  // Cada saque empieza con controles y estado aéreo limpios.
  keys.clear();
  jumpQueued = false;
  jumpCount = 0;
  gamepadJumpWasDown = false;
  boostActive = false;
  carBody.setTranslation({ x: 0, y: 1.1, z: 15 }, true);
  carBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  carBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  carBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  rivalBody.setTranslation({ x: 0, y: 1.1, z: -15 }, true);
  rivalBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  rivalBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  rivalBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  ballBody.setTranslation({ x: 0, y: 2, z: 0 }, true);
  ballBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  ballBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  boost = 100;
}

function startMatch() {
  // Oculta el menú al instante para que el clic tenga respuesta visual.
  $("menu").style.display = "none";
  gameMode = $("gameMode").value;
  modeSettings = getGameMode(gameMode);
  blueScore = 0;
  orangeScore = 0;
  remaining = modeSettings.duration;
  kickoffCountdown = 3;
  paused = false;
  running = true;
  resetBodies();
  configureModeActors();
  lastGoalAt = -10;
  $("modeDescription").textContent = gameMode === "training"
    ? "Entrena sin rival ni cronómetro. Pulsa R para recolocar la pelota."
    : "Juega contra la IA y marca más goles en 3 minutos.";
  updateHud();
  $("pause").textContent = "PAUSA";
  $("menu").style.display = "none";
  setMessage(kickoffCountdown > 0 ? String(Math.ceil(kickoffCountdown)) : "");
}

function togglePause() {
  if (!running) return;
  paused = !paused;
  $("pause").textContent = paused ? "CONTINUAR" : "PAUSA";
  setMessage(paused ? "PAUSA" : "");
}

function goal(team) {
  const now = performance.now() / 1000;
  if (now - lastGoalAt < 1.8) return;
  lastGoalAt = now;
  if (modeSettings.countsGoals) {
    if (team === "blue") blueScore += 1;
    else orangeScore += 1;
  }
  setMessage(gameMode === "training" ? "¡GOL! SIGUE PRACTICANDO" : team === "blue" ? "¡GOL AZUL!" : "¡GOL NARANJA!");
  resetBodies();
  configureModeActors();
  kickoffCountdown = 2;
  updateHud();
  window.setTimeout(() => { if (running && !paused) setMessage(""); }, 1400);
}

function readInput(dt) {
  const gamepad = navigator.getGamepads ? Array.from(navigator.getGamepads()).find(Boolean) : null;
  const axis = (value) => Math.abs(value ?? 0) < 0.16 ? 0 : value;
  const padThrottle = gamepad ? (gamepad.buttons[7]?.value ?? 0) - (gamepad.buttons[6]?.value ?? 0) : 0;
  const keyboardThrottle = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown"));
  const throttle = Math.max(-1, Math.min(1, keyboardThrottle + padThrottle));
  const keyboardSteer = Number(keys.has("KeyA") || keys.has("ArrowLeft")) - Number(keys.has("KeyD") || keys.has("ArrowRight"));
  const steer = Math.max(-1, Math.min(1, keyboardSteer + (gamepad ? axis(gamepad.axes[0]) : 0)));
  const wantsBoost = keys.has("ShiftLeft") || keys.has("ShiftRight") || Boolean(gamepad?.buttons[1]?.pressed);
  boostActive = wantsBoost && throttle > 0 && boost > 0;
  if (boostActive) boost = Math.max(0, boost - 34 * dt);
  else boost = Math.min(100, boost + 9 * dt);

  const carPosition = carBody.translation();
  const carVelocity = carBody.linvel();
  const surface = applySurfaceDriveAssist(carBody, dt, { halfWidth: 18, halfLength: 30, ceilingHeight: 13.5 });
  const grounded = surface === "floor" && carPosition.y <= 0.56 && Math.abs(carVelocity.y) <= 0.9;
  if (grounded) jumpCount = 0;
  const gamepadJump = Boolean(gamepad?.buttons[0]?.pressed);
  const jumpPressed = jumpQueued || (gamepadJump && !gamepadJumpWasDown);
  gamepadJumpWasDown = gamepadJump;
  const firstJump = jumpPressed && grounded;
  const doubleJump = jumpPressed && !grounded && jumpCount === 1;
  if (firstJump) jumpCount = 1;
  else if (doubleJump) jumpCount = 2;
  const drifting = keys.has("ControlLeft") || keys.has("ControlRight") || Boolean(gamepad?.buttons[2]?.pressed);
  driveCar(carBody, {
    throttle, steer, boost: boostActive, drift: drifting,
    jumpPressed: firstJump, doubleJumpPressed: doubleJump, grounded,
    airPitch: Number(keys.has("KeyS")) - Number(keys.has("KeyW")) - (gamepad ? axis(gamepad.axes[1]) : 0),
    airRoll: Number(keys.has("KeyD")) - Number(keys.has("KeyA")),
    airYaw: Number(keys.has("KeyE")) - Number(keys.has("KeyQ"))
  }, dt);
  jumpQueued = false;
  $("boost").style.width = boost + "%";
}

function syncVisuals() {
  const carPos = carBody.translation();
  const carRot = carBody.rotation();
  carVisual.group.position.set(carPos.x, carPos.y, carPos.z);
  carVisual.group.quaternion.set(carRot.x, carRot.y, carRot.z, carRot.w);
  const speed = Math.hypot(carBody.linvel().x, carBody.linvel().z);
  for (const wheel of carVisual.wheels) wheel.rotation.x -= speed * 0.012;
  carVisual.boostFlame.visible = boostActive;

  const rivalPos = rivalBody.translation();
  const rivalRot = rivalBody.rotation();
  rivalVisual.group.position.set(rivalPos.x, rivalPos.y, rivalPos.z);
  rivalVisual.group.quaternion.set(rivalRot.x, rivalRot.y, rivalRot.z, rivalRot.w);

  const ballPos = ballBody.translation();
  const ballRot = ballBody.rotation();
  ballVisual.position.set(ballPos.x, ballPos.y, ballPos.z);
  ballVisual.quaternion.set(ballRot.x, ballRot.y, ballRot.z, ballRot.w);
}

function updateCamera(dt) {
  const p = carBody.translation();
  const r = carBody.rotation();
  const yaw = Math.atan2(2 * (r.w * r.y + r.x * r.z), 1 - 2 * (r.y * r.y + r.z * r.z));
  const ballPosition = ballBody.translation();
  const carTarget = new THREE.Vector3(p.x, p.y, p.z);
  const ballTarget = new THREE.Vector3(ballPosition.x, ballPosition.y, ballPosition.z);
  const targetPoint = cameraMode === "ball" ? ballTarget : carTarget;
  const offset = cameraMode === "ball"
    ? new THREE.Vector3(0, 11, 16)
    : new THREE.Vector3(0, 7, 11).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const desiredPosition = targetPoint.clone().add(offset);
  const lookPoint = cameraMode === "ball"
    ? ballTarget
    : new THREE.Vector3(
      p.x * 0.72 + ballPosition.x * 0.28,
      p.y + 1 + Math.max(0, ballPosition.y - 2) * 0.12,
      p.z * 0.72 + ballPosition.z * 0.28
    );
  camera.position.lerp(desiredPosition, 1 - Math.exp(-5 * dt));
  camera.lookAt(lookPoint);
}
function toggleCameraMode() {
  cameraMode = cameraMode === "car" ? "ball" : "car";
  $("cameraMode").textContent = cameraMode === "car" ? "CÁMARA: COCHE" : "CÁMARA: PELOTA";
}

function updateRivalAI(dt) {
  const rivalPosition = rivalBody.translation();
  const ballPosition = ballBody.translation();
  const dx = ballPosition.x - rivalPosition.x;
  const dz = ballPosition.z - rivalPosition.z;
  const distance = Math.hypot(dx, dz);
  const rotation = rivalBody.rotation();
  const yaw = Math.atan2(
    2 * (rotation.w * rotation.y + rotation.x * rotation.z),
    1 - 2 * (rotation.y * rotation.y + rotation.z * rotation.z)
  );
  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  const cross = forwardZ * dx - forwardX * dz;
  const dot = forwardX * dx + forwardZ * dz;
  const angle = Math.atan2(cross, dot);
  const steerAI = Math.max(-1, Math.min(1, angle * 1.8));
  const rivalGrounded = rivalPosition.y <= 0.56 && Math.abs(rivalBody.linvel().y) <= 0.9;

  driveCar(rivalBody, {
    throttle: distance > 2.8 ? 1 : 0.25,
    steer: steerAI,
    boost: distance > 12 && Math.abs(angle) < 0.55,
    grounded: rivalGrounded,
    jumpPressed: rivalGrounded && distance < 4 && ballPosition.y > 2.5 && Math.random() < dt * 0.7
  }, dt);
}

function checkGoal() {
  const p = ballBody.translation();
  if (isGoalPosition(p, { goalHalfWidth: CONFIG.goalHalfWidth, goalHeight: CONFIG.goalHeight })) {
    goal(p.z < 0 ? "blue" : "orange");
  }
}

function finishMatch() {
  running = false;
  kickoffCountdown = 0;
  const result = blueScore > orangeScore ? "¡VICTORIA AZUL!" : orangeScore > blueScore ? "¡VICTORIA NARANJA!" : "¡EMPATE!";
  setMessage(result);
  $("start").textContent = "JUGAR DE NUEVO";
  $("menu").style.display = "flex";
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastFrame) / 1000, 1 / 30);
  lastFrame = now;

  if (running && !paused) {
    if (kickoffCountdown > 0) {
      const previousNumber = Math.ceil(kickoffCountdown);
      kickoffCountdown = Math.max(0, kickoffCountdown - dt);
      const currentNumber = Math.ceil(kickoffCountdown);
      if (currentNumber !== previousNumber) {
        setMessage(currentNumber > 0 ? String(currentNumber) : "¡YA!");
        if (kickoffCountdown === 0) {
          window.setTimeout(() => { if (running && !paused) setMessage(""); }, 450);
        }
      }
    } else {
      readInput(dt);
      if (modeSettings.hasRival) updateRivalAI(dt);
      stepPhysics(world, dt);
      checkGoal();
      if (modeSettings.hasTimer) {
        remaining = Math.max(0, remaining - dt);
        if (remaining === 0) finishMatch();
      }
      updateHud();
    }
    updateCamera(dt);
  }
  syncVisuals();
  renderer.render(scene, camera);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) event.preventDefault();
  keys.add(event.code);
  if (event.code === "Space" && !event.repeat && running && !paused) jumpQueued = true;
  if (event.code === "KeyP" && !event.repeat) togglePause();
  if (event.code === "KeyC" && !event.repeat) toggleCameraMode();
  if (event.code === "KeyR" && !event.repeat && running && !paused && gameMode === "training") resetBall();
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());

// Evita que el coche siga acelerando o que el partido avance en segundo plano.
// Al volver a la pestaña, el jugador reanuda la partida manualmente.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    keys.clear();
    jumpQueued = false;
    if (running && !paused) {
      paused = true;
      $("pause").textContent = "CONTINUAR";
      setMessage("PAUSA");
    }
  }
});

$("start").addEventListener("click", startMatch);
$("pause").addEventListener("click", togglePause);
$("cameraMode").addEventListener("click", toggleCameraMode);
$("gameMode").addEventListener("change", () => {
  $("modeDescription").textContent = $("gameMode").value === "training"
    ? "Entrena sin rival ni cronómetro. Pulsa R para recolocar la pelota."
    : "Juega contra la IA y marca más goles en 3 minutos.";
});
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
});

camera.position.set(0, 9, 27);
camera.lookAt(0, 1, 15);
updateHud();
requestAnimationFrame(animate);

}

initGame().catch((error) => {
  const message = error && error.message ? error.message : String(error);
  if (typeof window.showLoadError === "function") window.showLoadError(message);
  else {
    const panel = document.getElementById("loadError");
    if (panel) {
      panel.textContent = "No se pudo iniciar el juego: " + message;
      panel.style.display = "block";
      document.getElementById("menu").style.display = "flex";
    }
  }
  console.error("NEON STRIKE initialization failed:", error);
});
