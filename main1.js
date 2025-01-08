import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1.5); // Soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

// Load GLTF model
const loader = new GLTFLoader();
loader.load('scene.glb', function (glb) {
    // scene.add(glb.scene);
    const sceneObject = glb.scene;
    scene.add(sceneObject);

    // Add collidable objects (e.g., buildings, lamps)
    sceneObject.traverse((child) => {
        console.log(child.name,'======name');
        if (child.isMesh && child.name !== 'Road') {
            collidableObjects.push(child);
            child.geometry.computeBoundingBox(); // Ensure bounding box is calculated
            child.userData.boundingBox = child.geometry.boundingBox.clone();
        }
    });
}, undefined, function (error) {
    console.error(error);
});

// PointerLockControls
const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed = 2.5;
// Attach PointerLockControls to the document
document.addEventListener('click', () => {
    controls.lock(); // Lock the pointer and start camera movement
});

// Handle lock and unlock events
controls.addEventListener('lock', () => {
    console.log('Pointer locked');
});

controls.addEventListener('unlock', () => {
    console.log('Pointer unlocked');
});

// Camera initial position
camera.position.set(0, 2, 5);

// Movement variables
const move = { forward: 0, backward: 0, left: 0, right: 0 };

// Keydown and keyup events to handle movement
document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyW') move.forward = 1;
    if (event.code === 'KeyS') move.backward = 1;
    if (event.code === 'KeyA') move.left = 1;
    if (event.code === 'KeyD') move.right = 1;
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'KeyW') move.forward = 0;
    if (event.code === 'KeyS') move.backward = 0;
    if (event.code === 'KeyA') move.left = 0;
    if (event.code === 'KeyD') move.right = 0;
});

// Animation loop
function animate() {
    const delta = clock.getDelta();

    if (controls.isLocked) {
        const speed = 10 * delta; // Adjust movement speed
        if (move.forward) controls.moveForward(speed);
        if (move.backward) controls.moveForward(-speed);
        if (move.left) controls.moveRight(-speed);
        if (move.right) controls.moveRight(speed);
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
