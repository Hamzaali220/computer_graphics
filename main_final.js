
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
const collisionObjects = []; // Array to store objects that need collision detection
const raycaster = new THREE.Raycaster();
const move = { forward: 0, backward: 0, left: 0, right: 0 };

const loader = new GLTFLoader();
// Add objects to collisionObjects array
loader.load('low_poly_city.glb', (glb) => {
    scene.add(glb.scene);
    glb.scene.traverse((child) => {
        if (child.isMesh ) {
            console.log(child.name);
            collisionObjects.push(child); // Add meshes to the collision detection array
        }
    });
});

// Ambient Light for overall illumination
const light = new THREE.AmbientLight(0xffffff, 1.5); // Soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);


const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed = 1.5;

document.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    console.log('Pointer locked');
});

controls.addEventListener('unlock', () => {
    console.log('Pointer unlocked');
});

// Camera initial position
camera.position.set(0, 2, 5);

// Collision Detection Variables


// Keydown and keyup events to handle movement
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        jump(); // Trigger jump
    }
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


// Function to check for collisions
function checkCollision(newPosition) {
    const directions = [
        // new THREE.Vector3(0, -1, 0), // Down
        new THREE.Vector3(0, 1, 0),  // Up
        new THREE.Vector3(1, 0, 0),  // Right
        new THREE.Vector3(-1, 0, 0), // Left
        new THREE.Vector3(0, 0, 1),  // Forward
        new THREE.Vector3(0, 0, -1)  // Backward
    ];

    for (let i = 0; i < directions.length; i++) {
        raycaster.set(newPosition, directions[i]);
        const intersections = raycaster.intersectObjects(collisionObjects, true);
        if (intersections.length > 0 && intersections[0].distance < 1) {
            console.log(intersections, 'intersections');
            return true; // Return true if there is a collision
        }
    }
    return false; // Return false if no collision
}

// Gravity variables
let isJumping = false;
const jumpForce = 5; // Initial upward velocity
const gravity = -9.8;
let velocityY = 0;
const groundLevel = 0.5; // Adjust this value based on your scene's ground level
function applyGravity(delta) {
    // Check if above ground or still in the jumping process
    if (camera.position.y > groundLevel || velocityY > 0) {
        velocityY += gravity * delta; // Apply gravity to velocity
    } else {
        // Reset to ground level and stop movement
        camera.position.y = groundLevel;
        velocityY = 0;
        isJumping = false; // Allow jumping again
    }

    // Update camera position based on velocity
    camera.position.y += velocityY * delta;

    // Prevent the camera from going below ground level
    if (camera.position.y < groundLevel) {
        camera.position.y = groundLevel;
        velocityY = 0;
        isJumping = false;
    }
}


function jump() {
    console.log(`Jump Triggered! isJumping: ${isJumping}, Y Position: ${camera.position.y}`);
    if (!isJumping && Math.abs(camera.position.y - groundLevel) < 0.01) {
        velocityY = jumpForce;
        isJumping = true;
    }
}

function animate() {
    const delta = clock.getDelta();
    const speed =  3*delta;

    let direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    let nextPosition = camera.position.clone();

    if (controls.isLocked) {
        if (move.forward) nextPosition.addScaledVector(direction, speed);
        if (move.backward) nextPosition.addScaledVector(direction, -speed);

        const right = new THREE.Vector3().crossVectors(camera.up, direction).normalize();
        if (move.left) nextPosition.addScaledVector(right, -speed);
        if (move.right) nextPosition.addScaledVector(right, speed);

        if (!checkCollision(nextPosition)) {
            camera.position.copy(nextPosition);
        }
    }

    applyGravity(delta);
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

