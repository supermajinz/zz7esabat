import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Create the scene
const scene = new THREE.Scene();

// Create and position the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 7); // Position the camera so it's outside of the submarine

camera.far = 1000;
camera.near = 0.1;
camera.fov = 60;
// Create and configure the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add orbit controls for easy navigation
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Load the panoramic skybox image
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
    new URL('./textures/panorama.png', import.meta.url).href, // Path to your panoramic image
    (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping; // Set the correct mapping for panoramic images
        scene.background = texture;
    },
    undefined,
    (error) => {
        console.error('An error happened while loading the skybox image', error);
    }
);

// Load the submarine model
const gltfLoader = new GLTFLoader();
let submarine;
gltfLoader.load(
    new URL('./models/submarine.glb', import.meta.url).href, // Adjust the path to your GLB file
    (gltf) => {
        submarine = gltf.scene;
        submarine.scale.set(10,10,10);
        submarine.position.set(0, 0, 0); // Set initial position of the submarine
        scene.add(submarine);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('An error happened', error);
    }
);
const terrainLoader = new GLTFLoader();
terrainLoader.load(
  'models/underwater_terrain.glb', // adjust the path to your terrain model
  (gltf) => {
    const terrainModel = gltf.scene;
    terrainModel.scale.set(100, 100, 100); // adjust the scale to fit your scene
    terrainModel.position.set(0,-60,0);
    scene.add(terrainModel);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('Error loading terrain model:', error);
  }
);

// Load the seaweed model
const seaweedLoader = new GLTFLoader();
seaweedLoader.load(
  'models/seaweed.glb', // adjust the path to your seaweed model
  (gltf) => {
    const seaweedModel = gltf.scene;

    // Create 50 instances of the seaweed model
    for (let i = 0; i < 200; i++) {
        const seaweedInstance = seaweedModel.clone();
        seaweedInstance.scale.set(10, 10, 10);
      
        // Randomize the position wihin a larger cube
        const cubeSize = 1500; // adjust to change the size of the distribution cube
        const x = Math.random() * cubeSize - cubeSize / 2;
        const y = -50
        const z = Math.random() * cubeSize - cubeSize / 2;
      
        seaweedInstance.position.set(x, y, z);
        scene.add(seaweedInstance);
      }
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  },
  (error) => {
    console.error('Error loading seaweed model:', error);
  }
);
// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 10); // Position the light like the sun
scene.add(directionalLight);

// Variables for submarine movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let rotateLeft = false;
let rotateRight = false;
let rotateUp = false;
let rotateDown = false;

// Event listeners for keyboard controls
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'w':
            moveForward = true;
            break;
        case 's':
            moveBackward = true;
            break;
        case 'a':
            moveLeft = true;
            break;
        case 'd':
            moveRight = true;
            break;
        case 'ArrowLeft':
            rotateLeft = true;
            break;
        case 'ArrowRight':
            rotateRight = true;
            break;
        case 'ArrowUp':
            rotateUp = true;
            break;
        case 'ArrowDown':
            rotateDown = true;
            break;
    }
});

document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'w':
            moveForward = false;
            break;
        case 's':
            moveBackward = false;
            break;
        case 'a':
            moveLeft = false;
            break;
        case 'd':
            moveRight = false;
            break;
        case 'ArrowLeft':
            rotateLeft = false;
            break;
        case 'ArrowRight':
            rotateRight = false;
            break;
        case 'ArrowUp':
            rotateUp = false;
            break;
        case 'ArrowDown':
            rotateDown = false;
            break;
    }
});

// Submarine movement logic
function updateSubmarine() {
    if (!submarine) return;

    const moveSpeed = 0.1;
    const rotationSpeed = 0.002;

    if (moveForward) submarine.translateZ(-moveSpeed);
    if (moveBackward) submarine.translateZ(moveSpeed);
    if (moveLeft) submarine.translateX(-moveSpeed);
    if (moveRight) submarine.translateX(moveSpeed);

    if (rotateLeft) submarine.rotation.y += rotationSpeed;
    if (rotateRight) submarine.rotation.y -= rotationSpeed;
    if (rotateLeft) submarine.rotation.y += rotationSpeed;
    if (rotateRight) submarine.rotation.y -= rotationSpeed;
    if (rotateUp) submarine.rotation.x += rotationSpeed;
    if (rotateDown) submarine.rotation.x -= rotationSpeed;
    
}
function updateCamera() {
    if (!submarine) return;
  
    camera.position.x = submarine.position.x;
    camera.position.y = submarine.position.y ; // Keep the camera 5 units above the submarine
    camera.position.z = submarine.position.z + 10; // Keep the camera 10 units behind the submarine
    camera.lookAt(submarine.position); // Make the camera look at the submarine
  }
  
  // Call the updateCamera function in the render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    updateSubmarine();
    updateCamera(); // Update the camera position and orientation
    renderer.render(scene, camera);
  }
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});