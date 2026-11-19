import * as THREE from "three";
import { createPhysicsWorld, stepPhysics } from "./physics.js";
import { createCarBody, driveCar } from "./car.js";
import { createBallBody } from "./ball.js";

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

  // Paredes laterales y fondos divididos para dejar libres las porterías.
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

function createCarVisual() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 3.6), material(0x06aaff, 0x023b72, 0.45));
  body.castShadow = true;
  group.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 1.55), material(0x182b42, 0x071a2d));
  cabin.position.set(0, 0.72, 0.1);
  group.add(cabin);

  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.42, 0.08), material(0x52dfff, 0x1177aa));
  glass.position.set(0, 0.72, -0.72);
  group.add(glass);

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
  return { group, wheels };
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
const ballBody = createBallBody(RAPIER, world, { x: 0, y: 2, z: 0 });
const ballVisual = createBallVisual();

const keys = new Set();
let running = false;
let paused = false;
let remaining = CONFIG.matchSeconds;
let blueScore = 0;
let orangeScore = 0;
let boost = 100;
let jumpQueued = false;
let lastGoalAt = -10;
let lastFrame = performance.now();

function setMessage(value) { $("message").textContent = value; }
function updateHud() {
  $("blueScore").textContent = String(blueScore);
  $("orangeScore").textContent = String(orangeScore);
  const mins = Math.floor(remaining / 60);
  const secs = Math.floor(remaining % 60);
  $("timer").textContent = String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
  $("boost").style.width = boost + "%";
}

function resetBodies() {
  carBody.setTranslation({ x: 0, y: 1.1, z: 15 }, true);
  carBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  carBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  carBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  ballBody.setTranslation({ x: 0, y: 2, z: 0 }, true);
  ballBody.setLinvel({ x: 0, y: 0, z: 0 }, true);
  ballBody.setAngvel({ x: 0, y: 0, z: 0 }, true);
  boost = 100;
}

function startMatch() {
  blueScore = 0;
  orangeScore = 0;
  remaining = CONFIG.matchSeconds;
  paused = false;
  running = true;
  resetBodies();
  updateHud();
  $("pause").textContent = "PAUSA";
  $("menu").style.display = "none";
  setMessage("");
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
  if (team === "blue") blueScore += 1;
  else orangeScore += 1;
  setMessage(team === "blue" ? "¡GOL AZUL!" : "¡GOL NARANJA!");
  resetBodies();
  updateHud();
  window.setTimeout(() => { if (running && !paused) setMessage(""); }, 1400);
}

function readInput(dt) {
  const throttle = Number(keys.has("KeyW") || keys.has("ArrowUp")) - Number(keys.has("KeyS") || keys.has("ArrowDown"));
  const steer = Number(keys.has("KeyA") || keys.has("ArrowLeft")) - Number(keys.has("KeyD") || keys.has("ArrowRight"));
  const wantsBoost = keys.has("ShiftLeft") || keys.has("ShiftRight");
  const boosting = wantsBoost && throttle > 0 && boost > 0;
  if (boosting) boost = Math.max(0, boost - 34 * dt);
  else boost = Math.min(100, boost + 9 * dt);

  const carPosition = carBody.translation();
  const carVelocity = carBody.linvel();
  const grounded = carPosition.y <= 0.53 && Math.abs(carVelocity.y) <= 0.25;
  driveCar(carBody, { throttle, steer, boost: boosting, jumpPressed: jumpQueued, grounded }, dt);
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

  const ballPos = ballBody.translation();
  const ballRot = ballBody.rotation();
  ballVisual.position.set(ballPos.x, ballPos.y, ballPos.z);
  ballVisual.quaternion.set(ballRot.x, ballRot.y, ballRot.z, ballRot.w);
}

function updateCamera(dt) {
  const p = carBody.translation();
  const r = carBody.rotation();
  const yaw = Math.atan2(2 * (r.w * r.y + r.x * r.z), 1 - 2 * (r.y * r.y + r.z * r.z));
  const offset = new THREE.Vector3(0, 7, 11).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  const target = new THREE.Vector3(p.x, p.y, p.z).add(offset);
  camera.position.lerp(target, 1 - Math.exp(-5 * dt));
  camera.lookAt(p.x, p.y + 1, p.z);
}

function checkGoal() {
  const p = ballBody.translation();
  if (Math.abs(p.z) > 30.2 && Math.abs(p.x) < CONFIG.goalHalfWidth && p.y < CONFIG.goalHeight) {
    goal(p.z < 0 ? "blue" : "orange");
  }
}

function finishMatch() {
  running = false;
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
    readInput(dt);
    stepPhysics(world, dt);
    checkGoal();
    remaining = Math.max(0, remaining - dt);
    if (remaining === 0) finishMatch();
    updateHud();
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
});
window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());
$("start").addEventListener("click", startMatch);
$("pause").addEventListener("click", togglePause);
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

camera.position.set(0, 9, 27);
camera.lookAt(0, 1, 15);
updateHud();
requestAnimationFrame(animate);
