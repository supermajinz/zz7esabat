import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GUI } from 'dat.gui';
import SubmarineRotation from '/SubmarineRotation';
import WithdrawalMovement from '/WithdrawalMovement';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
camera.position.set(0, 0, 7);

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.5;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;
controls.enablePan = true;
controls.enableRotate = true;
controls.screenSpacePanning = true;

const textureLoader = new THREE.TextureLoader();
textureLoader.load('./textures/panorama.png', (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
});

let submarine, fanBlades, water;

const gltfLoader = new GLTFLoader();
gltfLoader.load('./models/subnofan.glb', (gltf) => {
    submarine = gltf.scene;
    submarine.scale.set(10, 10, 10);
    submarine.position.set(0, 0, 0);
    scene.add(submarine);
    createFanBlades();
});

function createFanBlades() {
    const bladeMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.7 });

    const bladeWidth = 0.1;
    const bladeHeight = 1.5;
    const bladeDepth = 0.02;

    const bladeGeometry = new THREE.BoxGeometry(bladeWidth, bladeHeight, bladeDepth);
    const blade1 = new THREE.Mesh(bladeGeometry, bladeMaterial);
    const blade2 = blade1.clone();

    blade2.rotation.z = Math.PI / 2;

    fanBlades = new THREE.Group();
    fanBlades.add(blade1);
    fanBlades.add(blade2);

    submarine.add(fanBlades);
    fanBlades.position.set(0.11, -0.025, 0.671);
    fanBlades.scale.set(1 / 24, 1 / 24, 1 / 24);
}

gltfLoader.load('./models/underwater_terrain.glb', (gltf) => {
    const terrainModel = gltf.scene;
    terrainModel.scale.set(400, 400, 400);
    terrainModel.position.set(0, -400, 0);
    scene.add(terrainModel);
});

gltfLoader.load('./models/seaweed.glb', (gltf) => {
    const seaweedModel = gltf.scene;
    for (let i = 0; i < 200; i++) {
        const seaweedInstance = seaweedModel.clone();
        seaweedInstance.scale.set(5, 5, 5);
        const cubeSize = 1500;
        const x = Math.random() * cubeSize - cubeSize / 2;
        const y = -350;
        const z = Math.random() * cubeSize - cubeSize / 2;
        seaweedInstance.position.set(x, y, z);
        scene.add(seaweedInstance);
    }
});

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(0, 10, 10);
scene.add(directionalLight);

const submarineRotation = new SubmarineRotation();
const withdrawalMovement = new WithdrawalMovement();

const SubmarineForcers = {
    F_torque: 0,
    tau_z: 0,
    I_z: 1,
    tau_y: 0,
    I_y: 1,
    tanks_water_volume: 20,
    fan_speed: 0,
};

const AutoMovementVars = {
    desired_depth: 0,
};

const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);

const skyUniforms = sky.material.uniforms;
skyUniforms['turbidity'].value = 10;
skyUniforms['rayleigh'].value = 2;
skyUniforms['mieCoefficient'].value = 0.005;
skyUniforms['mieDirectionalG'].value = 0.8;

const parameters = {
    elevation: 2,
    azimuth: 180
};

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const sceneEnv = new THREE.Scene();

let renderTarget;

function updateSun() {
    const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
    const theta = THREE.MathUtils.degToRad(parameters.azimuth);

    const sun = new THREE.Vector3();
    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);
    water.material.uniforms['sunDirection'].value.copy(sun).normalize();

    if (renderTarget !== undefined) renderTarget.dispose();

    sceneEnv.add(sky);
    renderTarget = pmremGenerator.fromScene(sceneEnv);
    scene.add(sky);

    scene.environment = renderTarget.texture;
}

// Create water surface
const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
water = new Water(waterGeometry, {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: new THREE.TextureLoader().load('textures/water.jpg', (texture) => {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }),
    sunDirection: new THREE.Vector3(),
    sunColor: 0xffffff,
    waterColor: 0x001e0f,
    distortionScale: 3.7,
    fog: scene.fog !== undefined
});
water.rotation.x = -Math.PI / 2;
scene.add(water);

updateSun();

const gui = new GUI();
const rotationFolder = gui.addFolder('Submarine Rotation:');
rotationFolder.add(SubmarineForcers, 'F_torque', -200, 200).name('Torque (τz)').step(10);
rotationFolder.open();

const WithdrawalFolder = gui.addFolder('Withdrawal movement :');
WithdrawalFolder.add(SubmarineForcers, 'tanks_water_volume', 0, 100).name('V.tanks_water cm3').step(1);
WithdrawalFolder.add(SubmarineForcers, 'fan_speed', -10, 10).name('fan speed').step(0.1);
WithdrawalFolder.open();

const moveFolder = gui.addFolder('Auto Movement :');
moveFolder.add(AutoMovementVars, 'desired_depth', 0, 100).name('Desired Depth').step(1);

function updateCamera() {
    if (!submarine) return;

    const offset = new THREE.Vector3(0, 2, 15);
    const desiredPosition = submarine.position.clone().add(offset.applyQuaternion(submarine.quaternion));

    camera.position.lerp(desiredPosition, 0.1);

    const lookAtPosition = submarine.position.clone().add(new THREE.Vector3(0, 1, 0));
    camera.lookAt(lookAtPosition);

    controls.target.copy(submarine.position);
    controls.update();
}

let cameraLookAt = false;

function handleKeyDown(event) {
    if (event.key === 't') {
        cameraLookAt = !cameraLookAt;
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (submarine && fanBlades) {
        submarineRotation.HorizontalAngularMotionInMoment(submarine, SubmarineForcers.F_torque);
        withdrawalMovement.linearMotionInMoment(submarine, SubmarineForcers.tanks_water_volume * 0.01, SubmarineForcers.fan_speed);
        

        withdrawalMovement.autoChangeDepth(SubmarineForcers, AutoMovementVars.desired_depth);

        fanBlades.rotation.z += SubmarineForcers.fan_speed * 0.1;
    }

    gui.updateDisplay();

    if (cameraLookAt) {
        updateCamera();
    }

    water.material.uniforms['time'].value += 1.0 / 500.0;

    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', handleKeyDown);
