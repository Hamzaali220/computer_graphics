import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

// Create a simple flat map (ground) using a plane geometry
const geometry = new THREE.PlaneGeometry(1000, 1000);
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,    // Set color to green
    side: THREE.DoubleSide,
    transparent: true,  // Enable transparency
    opacity: 0        // Set opacity (0 is fully transparent, 1 is fully opaque)
});

const ground = new THREE.Mesh(geometry, material);
ground.rotation.x = -Math.PI / 2; // Rotate to lay flat on the ground
scene.add(ground);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1.5); // Soft white light
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);
const collisionObjects = []; // Array to store objects that need collision detection
const raycaster = new THREE.Raycaster();
// const move = { forward: 0, backward: 0, left: 0, right: 0 };
// Loader for car model
const loader = new GLTFLoader();
loader.load('low_poly_city.glb', (glb) => {
    scene.add(glb.scene);
    glb.scene.traverse((child) => {
        if (child.isMesh ) {
            console.log(child.name);
            collisionObjects.push(child); // Add meshes to the collision detection array
        }
    });
});
let car;
loader.load('trabant__-_low_poly_car_model.glb', (glb) => {
    car = glb.scene;
    car.scale.set(0.5, 0.5, 0.5); // Adjust the car size
    car.position.set(-2, 0, 10); // Starting position of the car
    scene.add(car);
});

// Keydown and keyup events for movement
const move = { forward: 0, backward: 0, left: 0, right: 0 };

document.addEventListener('keydown', (event) => {
    if (event.code === 'KeyW') move.backward = 1;
    if (event.code === 'KeyS') move.forward = 1;
    if (event.code === 'KeyA') move.left = 1;
    if (event.code === 'KeyD') move.right = 1;
});

document.addEventListener('keyup', (event) => {
    if (event.code === 'KeyW') move.backward = 0;
    if (event.code === 'KeyS') move.forward = 0;
    if (event.code === 'KeyA') move.left = 0;
    if (event.code === 'KeyD') move.right = 0;
});

// PointerLockControls for first-person control
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

// Function to check collisions with other objects
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
        if (intersections.length > 0 && intersections[0].distance < 1.5) {
            console.log(intersections, 'intersections');
            return true; // Return true if there is a collision
        }
    }
    return false; // Return false if no collision
}

// Movement and animation
// function animate() {
//     const delta = clock.getDelta();
//     const speed = 2.0 * delta; // Adjust speed (car speed)

//     if (car) {
//         let direction = new THREE.Vector3(0, 0, -1); // Default forward direction
//         car.getWorldDirection(direction); // Get the car's current direction
//         let nextPosition = car.position.clone();

//         // Move the car forward or backward based on user input
//         if (move.forward) nextPosition.addScaledVector(direction, speed);
//         if (move.backward) nextPosition.addScaledVector(direction, -speed);

//         // Left/Right Steering (rotate the car)
//         // const right = new THREE.Vector3().crossVectors(car.up, direction).normalize();
//         if (move.left) car.rotation.y += 0.05;
//         if (move.right) car.rotation.y -= 0.05;

//         // Update position based on the movement input
//         // car.position.copy(nextPosition);
//         if (!checkCollision(nextPosition)) {
//             car.position.copy(nextPosition);
//         }
//         // // Update Camera Position to Follow the Car (set behind the car)
//         // camera.position.set(car.position.x, car.position.y + 2, car.position.z + 5);
//         // camera.lookAt(car.position);
//         // Offset camera based on car's rotation
//         // Update Camera Position to Follow the Car
//         const cameraOffset = new THREE.Vector3(0, 2, 5); // Offset behind and above the car
//         const rotatedOffset = cameraOffset.applyMatrix4(new THREE.Matrix4().makeRotationY(car.rotation.y));
//         camera.position.copy(car.position.clone().add(rotatedOffset));

//         // Make the camera look at the car
//         camera.lookAt(car.position);
//         }

//     renderer.render(scene, camera);
// }

// renderer.setAnimationLoop(animate);




//new code
let velocity = 0; // Forward/backward velocity
const acceleration = 0.1; // How quickly the car accelerates
const deceleration = 0.05; // How quickly the car slows down
const maxSpeed = 5; // Maximum speed of the car
let cameraFreeMode = false; // Flag for camera free mode

function animate() {
    const delta = clock.getDelta();

    if (car) {
        let direction = new THREE.Vector3(0, 0, -1);
        car.getWorldDirection(direction);

        // Handle forward and backward movement with smooth acceleration
        if (move.forward) {
            velocity = Math.min(velocity + acceleration, maxSpeed);
        } else if (move.backward) {
            velocity = Math.max(velocity - acceleration, -maxSpeed);
        } else {
            // Gradually slow down the car when no input
            if (velocity > 0) velocity = Math.max(velocity - deceleration, 0);
            if (velocity < 0) velocity = Math.min(velocity + deceleration, 0);
        }

        // Update the car's position based on velocity
        const nextPosition = car.position.clone().addScaledVector(direction, velocity * delta);

        // Handle left and right turning
        if (velocity !== 0) {
        if (move.left) car.rotation.y += 0.05;
        if (move.right) car.rotation.y -= 0.05;
            // if (move.left) car.rotation.y += 0.05 * Math.sign(velocity); // Rotate based on velocity direction
            // if (move.right) car.rotation.y -= 0.05 * Math.sign(velocity);
        }
        // Collision detection
        if (!checkCollision(nextPosition)) {
            car.position.copy(nextPosition);
        }

        // Handle camera position and perspective
        if (!cameraFreeMode) {
            // Default driving perspective
            const cameraOffset = new THREE.Vector3(0, 2, 5);

            // Adjust camera for side views when turning
            if (move.left) cameraOffset.x = 1;
            if (move.right) cameraOffset.x = -1;

            // Rotate offset based on car's direction
            const rotatedOffset = cameraOffset.applyMatrix4(new THREE.Matrix4().makeRotationY(car.rotation.y));
            camera.position.copy(car.position.clone().add(rotatedOffset));

            // Make the camera look at the car
            camera.lookAt(car.position);
        }
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Mouse control for camera movement
document.addEventListener('mousemove', (event) => {
    if (cameraFreeMode) {
        const sensitivity = 0.002;
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;

        // Rotate the camera around the car
        camera.position.x -= movementX * sensitivity;
        camera.position.y += movementY * sensitivity;

        // Keep the camera looking at the car
        camera.lookAt(car.position);
    }
});

// Toggle camera modes
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        cameraFreeMode = !cameraFreeMode;
    }
    // Reset camera when starting driving
    if (event.code === 'KeyW' || event.code === 'KeyS' || event.code === 'KeyA' || event.code === 'KeyD') {
        // cameraFreeMode = false;
    }
});

