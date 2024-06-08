import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { CubeTextureLoader } from 'three';

// Create the scene
const scene = new THREE.Scene();

// Create and position the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = -20;
camera.position.y = 10;

// Create and configure the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add orbit controls for easy navigation
const controls = new OrbitControls(camera, renderer.domElement);

// Load the skybox
const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
    new URL('./textures/skybox/px.jpg', import.meta.url).href,
    new URL('./textures/skybox/nx.jpg', import.meta.url).href,
    new URL('./textures/skybox/py.jpg', import.meta.url).href,
    new URL('./textures/skybox/ny.jpg', import.meta.url).href,
    new URL('./textures/skybox/pz.jpg', import.meta.url).href,
    new URL('./textures/skybox/nz.jpg', import.meta.url).href,
]);
scene.background = texture;

// Load the .obj model
const objLoader = new OBJLoader();
objLoader.load(
    new URL('./models/submarine.obj', import.meta.url).href,
    (object) => {
        scene.add(object);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('An error happened', error);
    }
);

// Add lighting
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});