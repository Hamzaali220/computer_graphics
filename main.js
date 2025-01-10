import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Sky } from 'three/addons/objects/Sky.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const sky = new Sky();
sky.scale.setScalar( 450000 );

const phi = THREE.MathUtils.degToRad( 90 );
const theta = THREE.MathUtils.degToRad( 180 );
const sunPosition = new THREE.Vector3().setFromSphericalCoords( 1, phi, theta );

sky.material.uniforms.sunPosition.value = sunPosition;

scene.add( sky );

const geometry = new THREE.PlaneGeometry(1000, 1000);
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,    
    side: THREE.DoubleSide,
    transparent: true,  
    opacity: 0       
});

const ground = new THREE.Mesh(geometry, material);
ground.rotation.x = -Math.PI / 2; 
scene.add(ground);

// Lighting
const light = new THREE.AmbientLight(0xffffff, 1); 
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);
const collisionObjects = []; 
const raycaster = new THREE.Raycaster();
const loader = new GLTFLoader();
loader.load('low_poly_city.glb', (glb) => {
    scene.add(glb.scene);
    glb.scene.traverse((child) => {
        if (child.isMesh ) {
            console.log(child.name);
            collisionObjects.push(child); 
        }
    });
});
let car;
loader.load('trabant__-_low_poly_car_model.glb', (glb) => {
    car = glb.scene;
    car.scale.set(.60, .60, .60); 
    car.position.set(-2, 0, 10); 
    scene.add(car);
});

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

const controls = new PointerLockControls(camera, document.body);
controls.pointerSpeed = 1.5;

document.addEventListener('click', () => {
    if (isStarted){
    controls.lock();
}
});

controls.addEventListener('lock', () => {
    console.log('Pointer locked');
});

controls.addEventListener('unlock', () => {
    console.log('Pointer unlocked');
});


camera.position.set(0, 2, 5);


function checkCollision(b ) {
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
            return true; 
        }
    }
    return false;
}

let velocity = 0; 
const acceleration = 0.1; 
const deceleration = 0.05; 
const maxSpeed = 7; 
let cameraFreeMode = false; 

function animate() {
    const delta = clock.getDelta();

    if (car && isStarted && controls.isLocked) {
        let direction = new THREE.Vector3(0, 0, -1);
        car.getWorldDirection(direction);
        if (move.forward) {
            velocity = Math.min(velocity + acceleration, maxSpeed);
        } else if (move.backward) {
            velocity = Math.max(velocity - acceleration, -maxSpeed);
        } else {
            if (velocity > 0) velocity = Math.max(velocity - deceleration, 0);
            if (velocity < 0) velocity = Math.min(velocity + deceleration, 0);
        }

        const nextPosition = car.position.clone().addScaledVector(direction, velocity * delta);
        if (velocity !== 0 && !checkCollision(nextPosition)) {
            if(move.forward==1) {
                if (move.left) car.rotation.y -= 0.03;
                if (move.right) car.rotation.y += 0.03;
            }
            if(move.backward==1) {
                if (move.left) car.rotation.y += 0.03;
                if (move.right) car.rotation.y -= 0.03;
            }
            
        }
        if (!checkCollision(nextPosition)) {
            car.position.copy(nextPosition);
        }
        if (!cameraFreeMode && isStarted) {
            const cameraOffset = new THREE.Vector3(0, 2, 5);
            if (move.left) cameraOffset.x = 1;
            if (move.right) cameraOffset.x = -1;
            const rotatedOffset = cameraOffset.applyMatrix4(new THREE.Matrix4().makeRotationY(car.rotation.y));
            camera.position.copy(car.position.clone().add(rotatedOffset));
            camera.lookAt(car.position);
        }
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);
document.addEventListener('mousemove', (event) => {
    if (cameraFreeMode && isStarted) {
        const sensitivity = 0.002;
        const movementX = event.movementX || 0;
        const movementY = event.movementY || 0;
        camera.position.x -= movementX * sensitivity;
        camera.position.y += movementY * sensitivity;
        camera.lookAt(car.position);
    }
});

// Toggle camera modes
document.addEventListener('keydown', (event) => {
if (event.code === 'Space' && isStarted) {
        cameraFreeMode = !cameraFreeMode;
    }
});

const startButton = document.getElementById('startButton');
startButton.style.display = 'block';
let isStarted = false;
let info = document.getElementById('info');
startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    isStarted = true;
    info.style.display = 'block';
    animate();
});


